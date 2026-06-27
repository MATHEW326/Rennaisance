import re
import time
import concurrent.futures
from tools import web_search, scrape_url, extract_relevant_chunks
from agents import planner_chain, writer_chain, critic_chain

def parse_xml_tag(text, tag):
    """
    Helper to extract content wrapped in XML tags, case-insensitively and robustly.
    """
    pattern = f"<{tag}>(.*?)</{tag}>"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    return [m.strip() for m in matches]

def invoke_with_retry(chain, inputs, label="Agent", max_retries=3, base_delay=3):
    """
    Invokes a chain with retry logic for rate limits.
    """
    delay = base_delay
    for attempt in range(1, max_retries + 1):
        try:
            return chain.invoke(inputs)
        except Exception as e:
            err_msg = str(e).lower()
            is_rate_limit = "rate_limit" in err_msg or "429" in err_msg or "413" in err_msg or "limit" in err_msg
            if is_rate_limit and attempt < max_retries:
                print(f"[Rate Limit] {label} call rate-limited. Retrying in {delay}s... (Attempt {attempt}/{max_retries})")
                time.sleep(delay)
                delay *= 2
            else:
                raise e
    return chain.invoke(inputs)

def run_parallel_searches(queries):
    """
    Runs multiple web searches concurrently using a thread pool.
    """
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(len(queries), 1)) as executor:
        future_to_query = {
            executor.submit(web_search.invoke, {"query": q}): q 
            for q in queries
        }
        for future in concurrent.futures.as_completed(future_to_query):
            query = future_to_query[future]
            try:
                search_data = future.result()
                results.append((query, search_data))
            except Exception as e:
                print(f"[Warning] Search failed for query '{query}': {e}")
    return results

def run_parallel_scraping(urls):
    """
    Scrapes multiple URLs concurrently using a thread pool.
    """
    scraped_data = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(urls), 10) if urls else 1) as executor:
        future_to_url = {
            executor.submit(scrape_url.invoke, {"url": url}): url 
            for url in urls
        }
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                content = future.result()
                scraped_data[url] = content
            except Exception as e:
                scraped_data[url] = f"ERROR: Thread execution exception: {str(e)}"
    return scraped_data

def run_research(query: str):
    visited_urls = set()
    all_evidence = []
    all_snippets = []
    successfully_scraped = []
    skipped_urls = []
    
    print("\n" + "=" * 80)
    print(f"STEP 1: PLANNING FOR QUERY: '{query}'")
    print("=" * 80)
    
    try:
        planner_output = invoke_with_retry(planner_chain, {"question": query}, label="Planner")
        queries = parse_xml_tag(planner_output, "query")
    except Exception as e:
        print(f"[Warning] Planner agent failed: {e}. Falling back to default query.")
        queries = []

    if not queries:
        print("[Planner fallback] Using original query.")
        queries = [query]
        
    print("\nGenerated search queries:")
    for idx, q in enumerate(queries, start=1):
        print(f"  {idx}. {q}")
        
    # Pacing delay
    time.sleep(1)

    print("\n" + "=" * 80)
    print("STEP 2: RUNNING PARALLEL SEARCHES")
    print("=" * 80)
    
    search_results = run_parallel_searches(queries)
    
    urls_to_scrape = []
    for q, res in search_results:
        if isinstance(res, list):
            for item in res:
                url = item.get("url")
                snippet = item.get("content")
                if url:
                    if snippet:
                        all_snippets.append(f"Snippet (Source: {url}): {snippet}")
                    if url not in visited_urls:
                        urls_to_scrape.append(url)
                        visited_urls.add(url)
                        
    print(f"\nDiscovered {len(urls_to_scrape)} unique URLs to investigate.")
    
    if urls_to_scrape:
        print("\n" + "=" * 80)
        print("STEP 3: PARALLEL SCRAPING OF DISCOVERED PAGES")
        print("=" * 80)
        
        scrape_results = run_parallel_scraping(urls_to_scrape)
        
        # Calculate budget per URL to stay safely under Groq TPM limits
        # Keep total payload under 15,000 characters
        max_chars = max(1500, 15000 // max(len(scrape_results), 1))
        
        for url, content in scrape_results.items():
            if content.startswith("ERROR:"):
                print(f"❌ Skipped: {url} -> {content}")
                skipped_urls.append((url, content))
            else:
                truncated_content = extract_relevant_chunks(content, query, max_chars)
                print(f"✅ Scraped: {url} (Total: {len(content)} chars, Kept: {len(truncated_content)} chars)")
                successfully_scraped.append(url)
                all_evidence.append(f"Source: {url}\nContent: {truncated_content}")
    else:
        print("No URLs discovered during search.")
        
    # Fault Tolerance Fallback: If we couldn't scrape any page content, use the snippets
    if not all_evidence and all_snippets:
        print("\n[Fault Tolerance Fallback] No full pages scraped successfully. Using search snippets.")
        all_evidence = all_snippets
        
    evidence_text = "\n\n---\n\n".join(all_evidence)
    
    # Pacing delay
    time.sleep(1)

    print("\n" + "=" * 80)
    print("STEP 4: GENERATING INITIAL REPORT")
    print("=" * 80)
    
    report = invoke_with_retry(
        writer_chain, 
        {"question": query, "evidence": evidence_text or "No evidence available."}, 
        label="Writer"
    )
    
    print("Initial report generated.")
    
    # Pacing delay
    time.sleep(1)

    print("\n" + "=" * 80)
    print("STEP 5: RED TEAM CRITIQUE & GAP ANALYSIS")
    print("=" * 80)
    
    critic_output = invoke_with_retry(critic_chain, {"report": report}, label="Critic")
    critique_list = parse_xml_tag(critic_output, "critique")
    critique = critique_list[0] if critique_list else critic_output
    new_queries = parse_xml_tag(critic_output, "query")
    
    print("\nCritique:")
    print("-" * 80)
    print(critique)
    print("-" * 80)
    
    # Refinement Round
    if new_queries:
        # Pacing delay
        time.sleep(1)

        print("\n" + "=" * 80)
        print("STEP 6: REFINEMENT ROUND - INVESTIGATING GAPS")
        print("=" * 80)
        print("New queries from Red Team:")
        for idx, q in enumerate(new_queries, start=1):
            print(f"  {idx}. {q}")
            
        print("\nRunning parallel searches for refinement...")
        refinement_search_results = run_parallel_searches(new_queries)
        
        refinement_urls = []
        for q, res in refinement_search_results:
            if isinstance(res, list):
                for item in res:
                    url = item.get("url")
                    snippet = item.get("content")
                    if url:
                        if snippet:
                            all_snippets.append(f"Snippet (Source: {url}): {snippet}")
                        if url not in visited_urls:
                            refinement_urls.append(url)
                            visited_urls.add(url)
                            
        print(f"Discovered {len(refinement_urls)} new URLs for refinement.")
        if refinement_urls:
            print("\nScraping new URLs in parallel...")
            refinement_scrape_results = run_parallel_scraping(refinement_urls)
            
            # Recalculate max characters per URL based on total scraped successful URLs to stay in limits
            total_active_pages = len(successfully_scraped) + len(refinement_scrape_results)
            max_chars = max(1500, 15000 // max(total_active_pages, 1))
            
            # Re-adjust already successfully scraped sources
            rebuilt_evidence = []
            for item in all_evidence:
                # Extract the source URL from "Source: <url>\nContent: ..."
                lines = item.split("\n", 2)
                if len(lines) >= 3 and lines[0].startswith("Source:"):
                    source_url = lines[0][7:].strip()
                    content_body = lines[2]
                    rebuilt_evidence.append(f"Source: {source_url}\nContent: {extract_relevant_chunks(content_body, query, max_chars)}")
                else:
                    rebuilt_evidence.append(extract_relevant_chunks(item, query, max_chars))
            all_evidence = rebuilt_evidence

            for url, content in refinement_scrape_results.items():
                if content.startswith("ERROR:"):
                    print(f"❌ Skipped: {url} -> {content}")
                    skipped_urls.append((url, content))
                else:
                    truncated_content = extract_relevant_chunks(content, query, max_chars)
                    print(f"✅ Scraped: {url} (Total: {len(content)} chars, Kept: {len(truncated_content)} chars)")
                    successfully_scraped.append(url)
                    all_evidence.append(f"Source: {url}\nContent: {truncated_content}")
                    
        # Update report and critique
        print("\nRegenerating report with new evidence...")
        evidence_text = "\n\n---\n\n".join(all_evidence)
        
        # Pacing delay
        time.sleep(1)

        report = invoke_with_retry(
            writer_chain, 
            {"question": query, "evidence": evidence_text or "No evidence available."}, 
            label="Writer Refinement"
        )
        print("Final report updated.")
        
        # Pacing delay
        time.sleep(1)

        print("\nUpdating critique for the final report...")
        critic_output = invoke_with_retry(critic_chain, {"report": report}, label="Critic Refinement")
        critique_list = parse_xml_tag(critic_output, "critique")
        critique = critique_list[0] if critique_list else critic_output
        print("Final critique updated.")
    else:
        print("\nNo additional research queries requested by Red Team. Report is considered complete.")
        
    return {
        "status": "success",
        "report": report,
        "critique": critique,
        "sources": successfully_scraped,
        "skipped_sources": skipped_urls
    }