#!/usr/bin/env python3
"""
Find the correct Regal Sherman Oaks URL
"""

import sys
sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

# Try different URL patterns
urls_to_try = [
    "https://www.regmovies.com/theatres",
    "https://www.regmovies.com/theaters",
    "https://www.regmovies.com/locations",
]

for url in urls_to_try:
    try:
        print(f"\nTrying: {url}", file=sys.stderr)
        page = StealthyFetcher.fetch(url, solve_cloudflare=True, timeout=60000)
        print(f"Status: {page.status}", file=sys.stderr)
        
        if page.status == 200:
            print(f"SUCCESS! URL works: {url}", file=sys.stderr)
            # Try to find Sherman Oaks in the page
            if 'sherman' in page.text.lower() or 'galleria' in page.text.lower():
                print("Found Sherman Oaks/Galleria mention!", file=sys.stderr)
            break
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
