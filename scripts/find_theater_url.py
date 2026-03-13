#!/usr/bin/env python3
"""
Find correct Regal Sherman Oaks URL
"""

import sys
import re

sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

# Try to find Sherman Oaks theater from main page
def find_theater():
    # Start with main theaters page
    url = "https://www.regmovies.com/theatres"
    
    print(f"Fetching: {url}", file=sys.stderr)
    
    page = StealthyFetcher.fetch(
        url,
        solve_cloudflare=True,
        headless=True,
        timeout=60000,
        wait=5000
    )
    
    print(f"Status: {page.status}", file=sys.stderr)
    
    html = str(page)
    
    # Save for inspection
    with open('/tmp/regal_theaters_list.html', 'w') as f:
        f.write(html)
    
    # Look for Sherman Oaks references
    patterns = [
        r'href="([^"]*sherman[^"]*)"',
        r'href="([^"]*galleria[^"]*)"', 
        r'data-theater-id="(\d+)"[^>]*>[^<]*(?:sherman|galleria)',
        r'"id":\s*(\d+)[^}]*(?:sherman|galleria)',
    ]
    
    found = []
    for pattern in patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        if matches:
            found.extend(matches)
    
    # Also look for any CA theaters
    ca_pattern = r'href="([^"]*theatre[^"]*)"[^>]*>[^<]*CA'
    ca_matches = re.findall(ca_pattern, html, re.IGNORECASE)
    
    results = {
        'sherman_oaks_refs': list(set(found))[:10],
        'ca_theaters': list(set(ca_matches))[:10],
        'html_sample': html[:2000]
    }
    
    print(json.dumps(results, indent=2))
    
    return results

if __name__ == '__main__':
    import json
    find_theater()
