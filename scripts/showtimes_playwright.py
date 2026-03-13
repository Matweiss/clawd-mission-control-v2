#!/usr/bin/env python3
"""
Local Playwright showtime scraper for Fandango and AMC
Falls back to local browser if Browserless not configured
"""

import json
import sys
import os
from datetime import datetime

# Try to use Browserless if available, otherwise local
BROWSERLESS_URL = os.environ.get('BROWSERLESS_URL', '')
BROWSERLESS_TOKEN = os.environ.get('BROWSERLESS_TOKEN', '')

# Theater configurations
THEATERS = {
    'fandango_sherman_oaks': {
        'name': 'Regal Sherman Oaks Galleria (via Fandango)',
        'url': 'https://www.fandango.com/regal-sherman-oaks-galleria-aavtk/theater-page',
        'source': 'Fandango'
    },
    'amc_sherman_oaks': {
        'name': 'AMC Sherman Oaks 7', 
        'url': 'https://www.amctheatres.com/movie-theatres/los-angeles/amc-sherman-oaks-7',
        'source': 'AMC'
    }
}

async def scrape_with_playwright(theater_key, theater_config):
    """Scrape showtimes using Playwright (local or Browserless)"""
    
    from playwright.async_api import async_playwright
    
    results = {
        'source': theater_config['source'],
        'theater': theater_config['name'],
        'url': theater_config['url'],
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False,
        'error': None,
        'using_browserless': bool(BROWSERLESS_URL)
    }
    
    try:
        async with async_playwright() as p:
            browser = None
            
            # Try Browserless first if configured
            if BROWSERLESS_URL:
                try:
                    print(f"[{theater_key}] Connecting to Browserless at {BROWSERLESS_URL}...", file=sys.stderr)
                    ws_endpoint = BROWSERLESS_URL
                    if BROWSERLESS_TOKEN:
                        ws_endpoint = f"{BROWSERLESS_URL}?token={BROWSERLESS_TOKEN}"
                    
                    browser = await p.chromium.connect_over_cdp(ws_endpoint)
                    print(f"[{theater_key}] ✓ Connected to Browserless", file=sys.stderr)
                except Exception as e:
                    print(f"[{theater_key}] ✗ Browserless failed: {e}, falling back to local...", file=sys.stderr)
                    browser = None
            
            # Fallback to local browser
            if not browser:
                print(f"[{theater_key}] Launching local Chromium...", file=sys.stderr)
                browser = await p.chromium.launch(headless=True)
                results['using_browserless'] = False
            
            # Create context with stealth options
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='America/Los_Angeles'
            )
            
            page = await context.new_page()
            
            # Navigate to theater page
            print(f"[{theater_key}] Navigating to {theater_config['url']}...", file=sys.stderr)
            
            try:
                response = await page.goto(
                    theater_config['url'],
                    wait_until='domcontentloaded',
                    timeout=30000
                )
                
                print(f"[{theater_key}] Page loaded - Status: {response.status if response else 'unknown'}", file=sys.stderr)
                
                # Wait a bit for JS to execute
                await page.wait_for_timeout(5000)
                
                # Get page content
                content = await page.content()
                print(f"[{theater_key}] Content length: {len(content)}", file=sys.stderr)
                
                # Try to extract showtime data
                # Look for common patterns in the HTML
                import re
                
                # Look for movie titles
                title_patterns = [
                    r'\b([A-Z][a-zA-Z\s\':]+)\b(?=.*?\d{1,2}:\d{2})',
                    r'class="[^"]*movie[^"]*"[^>]*\u003e\s*([^\u003c]{10,50})',
                ]
                
                found_titles = []
                for pattern in title_patterns:
                    matches = re.findall(pattern, content)
                    found_titles.extend([m for m in matches if len(m) > 3 and len(m) < 50])
                
                # Look for times
                time_pattern = r'\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)'
                times = re.findall(time_pattern, content)
                
                results['found_titles'] = list(set(found_titles))[:10]
                results['found_times'] = list(set(times))[:20]
                results['success'] = len(found_titles) > 0 or len(times) > 0
                
                print(f"[{theater_key}] Found {len(results['found_titles'])} titles, {len(results['found_times'])} times", file=sys.stderr)
                
            except Exception as e:
                results['error'] = f"Navigation error: {str(e)}"
                print(f"[{theater_key}] ✗ Navigation failed: {e}", file=sys.stderr)
            
            await browser.close()
            
    except Exception as e:
        import traceback
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        print(f"[{theater_key}] ✗ Fatal error: {e}", file=sys.stderr)
    
    return results


async def scrape_all_theaters():
    """Scrape all configured theaters"""
    
    all_results = {
        'timestamp': datetime.now().isoformat(),
        'browserless_configured': bool(BROWSERLESS_URL),
        'theaters': []
    }
    
    for theater_key, theater_config in THEATERS.items():
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Scraping: {theater_config['name']}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        
        result = await scrape_with_playwright(theater_key, theater_config)
        all_results['theaters'].append(result)
    
    return all_results


if __name__ == '__main__':
    import asyncio
    
    print("="*70, file=sys.stderr)
    print("Playwright Showtime Scraper", file=sys.stderr)
    print(f"Browserless: {'Configured' if BROWSERLESS_URL else 'Not configured (using local)'}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    results = asyncio.run(scrape_all_theaters())
    
    # Save results
    output_file = '/tmp/playwright_showtimes.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"Results saved to: {output_file}", file=sys.stderr)
    total_movies = sum(len(t.get('found_titles', [])) for t in results['theaters'])
    print(f"Total titles found: {total_movies}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    # Output JSON
    print(json.dumps(results, indent=2))
