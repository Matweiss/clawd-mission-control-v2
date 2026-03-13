#!/usr/bin/env python3
"""
Direct API approach for Regal - try known API patterns
"""

import json
import sys

sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

def try_regal_apis():
    """Try various Regal API endpoints"""
    
    # Common Regal API patterns
    api_urls = [
        # GraphQL endpoint (most likely)
        "https://www.regmovies.com/graphql",
        
        # REST API patterns
        "https://www.regmovies.com/api/theaters",
        "https://www.regmovies.com/api/theatres",
        "https://www.regmovies.com/api/v1/theaters",
        "https://www.regmovies.com/api/v2/theaters",
        
        # Specific theater search
        "https://www.regmovies.com/api/theaters?search=sherman%20oaks",
        "https://www.regmovies.com/api/theaters/nearby?lat=34.1508&lon=-118.4485",
        
        # Showtimes API
        "https://www.regmovies.com/api/showtimes",
        "https://www.regmovies.com/api/v1/showtimes",
    ]
    
    results = {
        'working_apis': [],
        'failed_apis': [],
        'data': None
    }
    
    for url in api_urls:
        try:
            print(f"Trying: {url}", file=sys.stderr)
            
            response = StealthyFetcher.fetch(
                url,
                solve_cloudflare=True,
                headless=True,
                timeout=30000
            )
            
            print(f"  Status: {response.status}", file=sys.stderr)
            
            if response.status == 200:
                content = str(response)
                print(f"  Content length: {len(content)}", file=sys.stderr)
                
                # Check if it's JSON
                try:
                    data = json.loads(content)
                    print(f"  ✓ Valid JSON! Keys: {list(data.keys())[:5] if isinstance(data, dict) else 'list'}", file=sys.stderr)
                    
                    results['working_apis'].append({
                        'url': url,
                        'status': response.status,
                        'sample_data': str(data)[:200]
                    })
                    
                    # If this looks like theater/showtime data, save it
                    content_str = str(data).lower()
                    if any(x in content_str for x in ['theater', 'showtime', 'movie', 'sherman']):
                        results['data'] = data
                        print(f"  ✓✓ This looks like theater data!", file=sys.stderr)
                        
                except:
                    print(f"  Not JSON", file=sys.stderr)
                    results['working_apis'].append({
                        'url': url,
                        'status': response.status,
                        'type': 'html'
                    })
            else:
                results['failed_apis'].append({
                    'url': url,
                    'status': response.status
                })
                
        except Exception as e:
            print(f"  Error: {str(e)[:100]}", file=sys.stderr)
            results['failed_apis'].append({
                'url': url,
                'error': str(e)[:100]
            })
    
    return results

if __name__ == '__main__':
    print("=" * 60, file=sys.stderr)
    print("Trying Regal API Endpoints", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    results = try_regal_apis()
    
    print("\n" + "=" * 60, file=sys.stderr)
    print("Results:", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    print(f"Working APIs: {len(results['working_apis'])}", file=sys.stderr)
    print(f"Failed APIs: {len(results['failed_apis'])}", file=sys.stderr)
    
    print(json.dumps(results, indent=2))
