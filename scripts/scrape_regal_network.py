#!/usr/bin/env python3
"""
Regal scraper with network interception
Captures API calls that load movie data
"""

import json
import sys
from datetime import datetime

async def scrape_regal_network():
    from playwright.async_api import async_playwright
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'url': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'api_calls': [],
        'movies': [],
        'success': False
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        
        # Intercept all network requests
        api_responses = []
        
        async def handle_route(route, request):
            url = request.url
            if 'api' in url.lower() or 'graphql' in url.lower() or 'json' in url.lower():
                print(f"API Call: {url[:100]}", file=sys.stderr)
                try:
                    response = await route.fetch()
                    body = await response.text()
                    api_responses.append({
                        'url': url,
                        'status': response.status,
                        'body_preview': body[:500]
                    })
                except:
                    pass
            await route.continue_()
        
        page = await context.new_page()
        await page.route("**/*", handle_route)
        
        print("Loading page with network interception...", file=sys.stderr)
        await page.goto(results['url'], wait_until='networkidle', timeout=60000)
        
        # Wait for API calls
        await page.wait_for_timeout(10000)
        
        results['api_calls'] = api_responses
        results['success'] = len(api_responses) > 0
        
        print(f"✓ Captured {len(api_responses)} API calls", file=sys.stderr)
        
        await browser.close()
    
    return results

if __name__ == '__main__':
    import asyncio
    results = asyncio.run(scrape_regal_network())
    
    with open('/tmp/regal_network.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(json.dumps(results, indent=2))
