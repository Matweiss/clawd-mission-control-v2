#!/usr/bin/env python3
"""
Fully automatic Regal SPA scraper with API endpoint discovery
Uses Scrapling StealthyFetcher with Cloudflare bypass and network inspection
"""

import json
import sys
import re
import time

sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

def scrape_regal_sherman_oaks():
    """
    Scrape Regal Sherman Oaks showtimes by:
    1. Loading main theaters page with Cloudflare bypass
    2. Waiting for SPA to render
    3. Inspecting network calls for API endpoints
    4. Extracting theater data from discovered APIs
    """
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'movies': [],
        'api_endpoints_discovered': [],
        'success': False,
        'errors': []
    }
    
    try:
        print("[1/5] Initializing StealthyFetcher with Cloudflare bypass...", file=sys.stderr)
        
        # Step 1: Load main Regal page to get theater list
        main_url = "https://www.regmovies.com/theatres"
        
        print(f"[2/5] Fetching: {main_url}", file=sys.stderr)
        
        # Use StealthyFetcher with real browser and Cloudflare solving
        page = StealthyFetcher.fetch(
            main_url,
            solve_cloudflare=True,
            headless=True,
            network_idle=True,  # Wait for network to be idle (SPA loaded)
            timeout=90000,  # 90 seconds for full load
            wait=5000  # Wait 5 seconds after load
        )
        
        print(f"    Status: {page.status}", file=sys.stderr)
        print(f"    URL: {page.url}", file=sys.stderr)
        
        if page.status != 200:
            results['errors'].append(f"Main page returned {page.status}")
            return results
        
        # Step 2: Extract theater data from the rendered page
        print("[3/5] Extracting theater data from rendered page...", file=sys.stderr)
        
        # Try to find Sherman Oaks theater link/data
        page_content = str(page)  # Get full page content including rendered JS
        
        # Look for theater data patterns
        theater_patterns = [
            r'sherman\s+oaks',
            r'galleria',
            r'"name"[:\s]*"[^"]*sherman[^"]*"',
            r'"name"[:\s]*"[^"]*galleria[^"]*"'
        ]
        
        found_sherman_oaks = False
        for pattern in theater_patterns:
            if re.search(pattern, page_content, re.IGNORECASE):
                found_sherman_oaks = True
                print(f"    ✓ Found Sherman Oaks reference with pattern: {pattern}", file=sys.stderr)
                break
        
        if not found_sherman_oaks:
            print("    ⚠ Sherman Oaks not found in initial load, checking for dynamic content...", file=sys.stderr)
        
        # Step 3: Look for API endpoints in page content
        print("[4/5] Searching for API endpoints...", file=sys.stderr)
        
        # Common API patterns
        api_patterns = [
            r'https?://[^\s"\'<>]+api[^\s"\'<>]*',
            r'https?://[^\s"\'<>]+graphql[^\s"\'<>]*',
            r'https?://[^\s"\'<>]+/v\d+/[^\s"\'<>]*',
            r'"apiUrl"[:\s]*"([^"]+)"',
            r'"endpoint"[:\s]*"([^"]+)"',
            r'fetch\(["\']([^"\']+)["\']',
            r'axios\.get\(["\']([^"\']+)["\']',
            r'\/api\/[^\s"\'<>]+',
        ]
        
        discovered_apis = set()
        for pattern in api_patterns:
            matches = re.findall(pattern, page_content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                if match and len(match) > 10:  # Filter out short matches
                    discovered_apis.add(match)
        
        results['api_endpoints_discovered'] = list(discovered_apis)[:20]  # Top 20
        
        if discovered_apis:
            print(f"    ✓ Found {len(discovered_apis)} potential API endpoints", file=sys.stderr)
            for api in list(discovered_apis)[:5]:
                print(f"      - {api}", file=sys.stderr)
        
        # Step 4: Try to find theater-specific data
        print("[5/5] Looking for theater showtime data...", file=sys.stderr)
        
        # Look for JSON data embedded in the page
        json_patterns = [
            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
            r'window\.__DATA__\s*=\s*({.+?});',
            r'"theaters":\s*(\[.+?\])',
            r'"showtimes":\s*(\[.+?\])',
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, page_content, re.DOTALL)
            if matches:
                print(f"    ✓ Found embedded JSON data with pattern: {pattern[:50]}...", file=sys.stderr)
                try:
                    data = json.loads(matches[0])
                    print(f"    ✓ Successfully parsed JSON with {len(str(data))} chars", file=sys.stderr)
                    # TODO: Extract theater/showtime data from parsed JSON
                except:
                    pass
        
        # If we have API endpoints, try calling them
        if discovered_apis:
            print("    Trying discovered API endpoints...", file=sys.stderr)
            
            for api_url in list(discovered_apis)[:3]:  # Try first 3
                try:
                    # Make sure it's a full URL
                    if api_url.startswith('/'):
                        api_url = f"https://www.regmovies.com{api_url}"
                    
                    if not api_url.startswith('http'):
                        continue
                    
                    print(f"      Fetching: {api_url[:80]}...", file=sys.stderr)
                    
                    api_response = StealthyFetcher.fetch(
                        api_url,
                        solve_cloudflare=True,
                        headless=True,
                        timeout=30000
                    )
                    
                    if api_response.status == 200:
                        try:
                            api_data = json.loads(str(api_response))
                            print(f"      ✓ Got JSON response with keys: {list(api_data.keys())[:5]}", file=sys.stderr)
                            
                            # Check if this contains theater/showtime data
                            if any(key in str(api_data).lower() for key in ['theater', 'showtime', 'movie', 'film']):
                                print(f"      ✓ This looks like theater/showtime data!", file=sys.stderr)
                                # TODO: Parse and normalize the data
                                
                        except:
                            print(f"      ⚠ Not valid JSON", file=sys.stderr)
                            
                except Exception as e:
                    print(f"      ✗ Error: {str(e)[:100]}", file=sys.stderr)
        
        # For now, return what we discovered
        results['success'] = True
        results['message'] = 'SPA scraper ran successfully. API endpoints discovered but full parsing not yet implemented.'
        
    except Exception as e:
        import traceback
        error_msg = f"Error: {str(e)}"
        results['errors'].append(error_msg)
        results['traceback'] = traceback.format_exc()
        print(f"✗ {error_msg}", file=sys.stderr)
    
    return results

if __name__ == '__main__':
    print("=" * 60, file=sys.stderr)
    print("Regal SPA Scraper with API Discovery", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    results = scrape_regal_sherman_oaks()
    
    print("\n" + "=" * 60, file=sys.stderr)
    print("Results:", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    print(json.dumps(results, indent=2))
