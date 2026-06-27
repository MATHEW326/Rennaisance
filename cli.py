import os
import sys

# Prevent OpenSSL Applink and SSLKEYLOGFILE path crashes on Windows
if "SSLKEYLOGFILE" in os.environ:
    del os.environ["SSLKEYLOGFILE"]

from workflow import run_research

# Configure UTF-8 output to avoid Windows console encoding issues when printing Web content
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

query = input("Research Question: ")

print("\nStarting research process...")
result = run_research(query)

if result.get("status") == "success":
    print("\n" + "=" * 80)
    print("FINAL REPORT")
    print("=" * 80)
    print(result["report"])

    print("\n" + "=" * 80)
    print("CRITIQUE")
    print("=" * 80)
    print(result["critique"])

    print("\n" + "=" * 80)
    print("INVESTIGATION SUMMARY")
    print("=" * 80)
    print(f"Successfully scraped sources ({len(result['sources'])}):")
    for s in result["sources"]:
        print(f"  - {s}")
    
    if result["skipped_sources"]:
        print(f"\nSkipped / Failed sources ({len(result['skipped_sources'])}):")
        for url, reason in result["skipped_sources"]:
            # Truncate error reasons if they are too long
            short_reason = reason[:80] + "..." if len(reason) > 80 else reason
            print(f"  - {url}: {short_reason}")
else:
    print(f"\n❌ Research failed: {result.get('error')}")
