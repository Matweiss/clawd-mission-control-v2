#!/usr/bin/env python3
"""
Regal SPA DOM Scraper - Aggressive version with shorter timeouts
"""

import json
import sys
import time

sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

def scrape_regal_fast():
    """Fast SPA scraper with aggressive timeouts"""
    
    url = 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria/0628'
    
    print(f"Loading: {url}", file=sys.stderr)
    
    # Aggressive fetch - shorter timeout
    page = StealthyFetcher.fetch(
        url,
        solve_cloudflare=True,
        headless=True,
        timeout=60000,  # 60 seconds max
        wait=5000       # 5 second wait after load
    )
    
    print(f"Status: {page.status}", file=sys.stderr)
    
    # Get raw HTML
    html = str(page)
    print(f"HTML length: {len(html)}", file=sys.stderr)
    
    # Save for analysis
    with open('/tmp/regal_page.html', 'w') as f:
        f.write(html)
    print("Saved to /tmp/regal_page.html", file=sys.stderr)
    
    # Try to find any movie-related content
    import re
    
    # Look for movie titles, showtimes, etc.
    patterns = [
        r'\b([A-Z][a-zA-Z\s]+)\b(?=.*?(?:\d{1,2}:\d{2}|PM|AM))',  # Title before time
        r'\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)',  # Time patterns
        r'(?:IMAX|3D|2D|Dolby|Standard)',     # Formats
    ]
    
    found_content = {}
    for pattern in patterns:
        matches = re.findall(pattern, html)
        if matches:
            found_content[pattern[:30]] = matches[:10]  # First 10 matches
    
    results = {
        'url': url,
        'status': page.status,
        'html_length': len(html),
        'found_patterns': found_content,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Save results
    with open('/tmp/regal_scrape_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(json.dumps(results, indent=2))
    return results

if __name__ == '__main__':
    scrape_regal_fast()
