#!/usr/bin/env python3
"""
Browserless-powered showtime scraper for Fandango and AMC
Uses Playwright via Browserless to handle SPAs, Cloudflare, and JS rendering
"""

import json
import sys
import os
from datetime import datetime

# Browserless configuration from environment
BROWSERLESS_URL = os.environ.get('BROWSERLESS_URL', 'wss://chrome.browserless.io')
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

async def scrape_with_browserless(theater_key, theater_config):
    """Scrape showtimes using Browserless Playwright"""
    
    from playwright.async_api import async_playwright
    
    results = {
        'source': theater_config['source'],
        'theater': theater_config['name'],
        'url': theater_config['url'],
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False,
        'error': None
    }
    
    try:
        async with async_playwright() as p:
            # Connect to Browserless
            ws_endpoint = BROWSERLESS_URL
            if BROWSERLESS_TOKEN:
                ws_endpoint = f"{BROWSERLESS_URL}?token={BROWSERLESS_TOKEN}"
            
            print(f"[{theater_key}] Connecting to Browserless...", file=sys.stderr)
            browser = await p.chromium.connect_over_cdp(ws_endpoint)
            
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
            
            response = await page.goto(
                theater_config['url'],
                wait_until='networkidle',
                timeout=60000
            )
            
            print(f"[{theater_key}] Page loaded - Status: {response.status}", file=sys.stderr)
            
            # Wait for dynamic content to load
            print(f"[{theater_key}] Waiting for showtime content...", file=sys.stderr)
            
            # Try multiple selectors for movie/showtime containers
            selectors = [
                '[data-testid="movie-card"]',
                '.movie-showtime',
                '.showtime-card',
                '[class*="movie"][class*="card"]',
                '[class*="showtime"]',
                'article',
                '.theater-showtime'
            ]
            
            found_selector = None
            for selector in selectors:
                try:
                    await page.wait_for_selector(selector, timeout=10000)
                    found_selector = selector
                    print(f"[{theater_key}] ✓ Found selector: {selector}", file=sys.stderr)
                    break
                except:
                    continue
            
            if not found_selector:
                print(f"[{theater_key}] ⚠ No movie selectors found, trying generic extraction...", file=sys.stderr)
                found_selector = 'body'
            
            # Extract movie data from rendered DOM
            movies = await page.evaluate('''(selector) => {
                const movieElements = document.querySelectorAll(selector);
                const movies = [];
                
                movieElements.forEach(elem => {
                    // Try to find title
                    const titleSelectors = ['h2', 'h3', 'h4', '.title', '[data-testid*="title"]', '.movie-title'];
                    let title = null;
                    for (const sel of titleSelectors) {
                        const el = elem.querySelector(sel);
                        if (el && el.textContent.trim()) {
                            title = el.textContent.trim();
                            break;
                        }
                    }
                    
                    if (!title) return;
                    
                    // Try to find showtimes
                    const showtimeSelectors = ['.showtime', '.time', '[data-testid*="time"]', 'button'];
                    const showtimes = [];
                    
                    for (const sel of showtimeSelectors) {
                        const timeElems = elem.querySelectorAll(sel);
                        timeElems.forEach(t => {
                            const text = t.textContent.trim();
                            if (text.match(/\\d{1,2}:\\d{2}/) || text.includes('PM') || text.includes('AM')) {
                                showtimes.push({
                                    time: text,
                                    availability: 'Available'
                                });
                            }
                        });
                    }
                    
                    // Try to find format (IMAX, 3D, etc.)
                    const formatSelectors = ['.format', '.tag', '[class*="imax"]', '[class*="3d"]'];
                    let format = null;
                    for (const sel of formatSelectors) {
                        const el = elem.querySelector(sel);
                        if (el && el.textContent.trim()) {
                            format = el.textContent.trim();
                            break;
                        }
                    }
                    
                    movies.push({
                        title: title,
                        format: format,
                        showtimes: showtimes
                    });
                });
                
                return movies;
            }''', found_selector)
            
            results['movies'] = movies
            results['success'] = len(movies) > 0
            
            print(f"[{theater_key}] ✓ Extracted {len(movies)} movies", file=sys.stderr)
            
            await browser.close()
            
    except Exception as e:
        import traceback
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        print(f"[{theater_key}] ✗ Error: {e}", file=sys.stderr)
    
    return results


async def scrape_all_theaters():
    """Scrape all configured theaters"""
    
    all_results = {
        'timestamp': datetime.now().isoformat(),
        'theaters': []
    }
    
    for theater_key, theater_config in THEATERS.items():
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Scraping: {theater_config['name']}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        
        result = await scrape_with_browserless(theater_key, theater_config)
        all_results['theaters'].append(result)
    
    return all_results


if __name__ == '__main__':
    import asyncio
    
    print("="*70, file=sys.stderr)
    print("Browserless Showtime Scraper", file=sys.stderr)
    print(f"Browserless URL: {BROWSERLESS_URL}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    results = asyncio.run(scrape_all_theaters())
    
    # Save results
    output_file = '/tmp/browserless_showtimes.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"Results saved to: {output_file}", file=sys.stderr)
    print(f"Theaters scraped: {len(results['theaters'])}", file=sys.stderr)
    print(f"Total movies found: {sum(len(t['movies']) for t in results['theaters'])}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    # Output JSON
    print(json.dumps(results, indent=2))
