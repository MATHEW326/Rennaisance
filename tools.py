import re
import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain.tools import tool
from tavily import TavilyClient
from rich import print

load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def split_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list:
    """
    Splits text into chunks of chunk_size with chunk_overlap, trying to split on word boundaries.
    """
    if not text:
        return []
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = start + chunk_size
        if end >= text_len:
            chunks.append(text[start:])
            break
        # Look for space to split on to avoid cutting words in half
        split_point = -1
        for i in range(min(150, chunk_size)):
            pos = end - i
            if text[pos].isspace():
                split_point = pos
                break
        if split_point != -1:
            chunks.append(text[start:split_point].strip())
            start = split_point - chunk_overlap
        else:
            chunks.append(text[start:end])
            start = end - chunk_overlap
    return chunks

def extract_relevant_chunks(text: str, query: str, max_total_chars: int = 3000) -> str:
    """
    Splits text into chunks and ranks them based on word overlap/TF-IDF similarity to the query,
    returning the top chunks sorted by their original document order to preserve reading context.
    """
    if not text or len(text) <= max_total_chars:
        return text

    # Split into chunks using the custom text splitter
    chunks = split_text(text, chunk_size=1000, chunk_overlap=200)
    
    if not chunks:
        return text[:max_total_chars]
        
    # Clean and tokenize query into lowercase terms
    query_words = set(re.findall(r'\w+', query.lower()))
    if not query_words:
        return text[:max_total_chars]
        
    # Score each chunk based on term overlap
    scored_chunks = []
    for idx, chunk in enumerate(chunks):
        chunk_words = re.findall(r'\w+', chunk.lower())
        score = sum(1 for w in chunk_words if w in query_words)
        # Normalize score to avoid favoring purely long chunks
        normalized_score = score / (len(chunk_words) + 1) if chunk_words else 0
        scored_chunks.append((normalized_score, idx, chunk))
        
    # Sort chunks by score descending
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Select chunks until we hit the max character budget
    selected = []
    current_length = 0
    for score, original_idx, chunk in scored_chunks:
        if current_length + len(chunk) > max_total_chars:
            if not selected:
                selected.append((original_idx, chunk[:max_total_chars]))
            break
        selected.append((original_idx, chunk))
        current_length += len(chunk)
        
    # Re-sort selected chunks by their original document position to keep sequential flow
    selected.sort(key=lambda x: x[0])
    
    return "\n\n... [Snippet Gap] ...\n\n".join([chunk for _, chunk in selected])

@tool
def web_search(query: str):
    """
    Searches for reliable information and
    returns structured search results.
    """
    results = tavily.search(
        query=query,
        max_results=3
    )
    return results["results"]

@tool
def scrape_url(url: str):
    """
    Scrapes the text content of a given URL and returns its cleaned text.
    If the scrape fails, returns a string starting with 'ERROR:'.
    """
    html_content = None
    playwright_err = None
    
    # 1. Try dynamic rendering with Playwright first
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            # Launch headless chromium
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            # Wait up to 15 seconds, resolve when network is idle
            page.goto(url, timeout=15000, wait_until="networkidle")
            html_content = page.content()
            browser.close()
    except Exception as e:
        playwright_err = str(e)
        
    # 2. Fall back to requests if Playwright is missing or fails
    if not html_content:
        try:
            response = requests.get(
                url,
                timeout=10,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )
            if response.status_code == 200:
                html_content = response.text
            else:
                err_detail = f"Page returned HTTP {response.status_code}"
                if playwright_err:
                    err_detail += f" (Playwright error: {playwright_err})"
                return f"ERROR: {err_detail}"
        except Exception as req_err:
            err_detail = f"Requests exception: {str(req_err)}"
            if playwright_err:
                err_detail += f" (Playwright error: {playwright_err})"
            return f"ERROR: {err_detail}"

    # 3. Clean HTML using BeautifulSoup
    try:
        soup = BeautifulSoup(html_content, "html.parser")

        # Strip script, style and layout elements
        for element in soup(["script", "style", "header", "footer", "nav", "iframe"]):
            element.decompose()

        content = soup.get_text(separator=" ", strip=True)
        # Normalize whitespace
        content = " ".join(content.split())

        ERROR_PATTERNS = [
            "not found",
            "page not found",
            "404",
            "content unavailable",
            "this page isn't available",
            "the page you requested could not be found"
        ]

        if len(content) < 100:
            return "ERROR: Page contains insufficient content"

        content_lower = content.lower()
        if any(pattern in content_lower for pattern in ERROR_PATTERNS):
            return "ERROR: Page appears to be an error page"

        return content

    except Exception as e:
        return f"ERROR: Exception occurred while cleaning page text: {str(e)}"

 