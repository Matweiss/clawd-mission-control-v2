#!/usr/bin/env python3
"""
Scrape Regal theaters list and find Sherman Oaks
"""

import sys
import json
sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

def find_sherman_oaks():
    url = "https://www.regmovies.com/theatres"
    
    try:
        print(f"Fetching: {url}", file=sys.stderr)
        page = StealthyFetcher.fetch(url, solve_cloudflare=True, timeout=60000)
        print(f"Status: {page.status}", file=sys.stderr)
        
        if page.status == 200:
            # Search for Sherman Oaks in the HTML
            content = page.text
            
            # Look for Sherman Oaks mentions
            if 'sherman oaks' in content.lower():
                print("\n✓ Found 'Sherman Oaks' in page!", file=sys.stderr)
                
                # Try to extract theater links
                from scrapling import Selector
                sel = Selector(content)
                
                # Look for theater links
                theaters = []
                links = sel.css('a[href*="theatre"], a[href*="theater"]')
                
                for link in links:
                    href = link.attr('href')
                    text = link.text().strip()
                    if href and ('sherman' in text.lower() or 'galleria' in text.lower() or 'sherman' in href.lower()):
                        theaters.append({
                            'name': text,
                            'url': href if href.startswith('http') else f"https://www.regmovies.com{href}"
                        })
                
                if theaters:
                    print(f"\nFound {len(theaters)} Sherman Oaks theaters:", file=sys.stderr)
                    for t in theaters:
                        print(f"  - {t['name']}: {t['url']}", file=sys.stderr)
                    
                    return theaters
            
            # Save page content for inspection
            with open('/tmp/regal_theatres.html', 'w') as f:
                f.write(content[:10000])  # First 10KB
            print("\nSaved page content to /tmp/regal_theatres.html", file=sys.stderr)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
    
    return []

if __name__ == '__main__':
    theaters = find_sherman_oaks()
    print(json.dumps(theaters, indent=2))
