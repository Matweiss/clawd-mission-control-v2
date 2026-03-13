#!/usr/bin/env python3
"""
Browserless-powered showtime scraper for Regal and CorePower
Uses Browserless.io to handle SPAs, Cloudflare, and JS rendering
"""

import json
import sys
import os
from datetime import datetime

# Browserless configuration
BROWSERLESS_URL = os.environ.get('BROWSERLESS_URL', 'wss://chrome.browserless.io')
BROWSERLESS_TOKEN = os.environ.get('BROWSERLESS_TOKEN', '')

# Theater/Studio configurations
SOURCES = {
    'regal_sherman_oaks': {
        'name': 'Regal Sherman Oaks Galleria',
        'url': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'source': 'Regal',
        'type': 'movies'
    },
    'corepower_schedule': {
        'name': 'CorePower Yoga Schedule',
        'url': 'https://www.corepoweryoga.com/yoga-schedules',
        'source': 'CorePower',
        'type': 'yoga'
    }
}

async def scrape_with_browserless(source_key, source_config):
    """Scrape using Browserless.io"""
    
    from playwright.async_api import async_playwright
    
    results = {
        'source': source_config['source'],
        'name': source_config['name'],
        'url': source_config['url'],
        'type': source_config['type'],
        'date': datetime.now().strftime('%Y-%m-%d'),
        'data': [],
        'success': False,
        'error': None
    }
    
    try:
        async with async_playwright() as p:
            # Connect to Browserless
            ws_endpoint = f"{BROWSERLESS_URL}?token={BROWSERLESS_TOKEN}"
            
            print(f"[{source_key}] Connecting to Browserless...", file=sys.stderr)
            browser = await p.chromium.connect_over_cdp(ws_endpoint)
            print(f"[{source_key}] ✓ Connected", file=sys.stderr)
            
            # Create context
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            # Navigate
            print(f"[{source_key}] Loading {source_config['url']}...", file=sys.stderr)
            response = await page.goto(
                source_config['url'],
                wait_until='networkidle',
                timeout=60000
            )
            
            print(f"[{source_key}] Status: {response.status if response else 'unknown'}", file=sys.stderr)
            
            # Wait for content to render
            await page.wait_for_timeout(5000)
            
            # Extract based on source type
            if source_config['type'] == 'movies':
                results['data'] = await extract_movies(page)
            elif source_config['type'] == 'yoga':
                results['data'] = await extract_yoga_classes(page)
            
            results['success'] = len(results['data']) > 0
            
            await browser.close()
            
    except Exception as e:
        import traceback
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        print(f"[{source_key}] ✗ Error: {e}", file=sys.stderr)
    
    return results


async def extract_movies(page):
    """Extract movie showtimes from Regal page"""
    
    # Try to find movie containers
    selectors = [
        '[data-testid="movie-card"]',
        '.movie-showtime',
        '.film-card',
        '[class*="movie"]',
        'article'
    ]
    
    movies = []
    
    for selector in selectors:
        try:
            await page.wait_for_selector(selector, timeout=10000)
            elements = await page.query_selector_all(selector)
            
            for elem in elements[:20]:  # First 20 movies
                try:
                    # Get title
                    title_elem = await elem.query_selector('h2, h3, .title, [data-testid*="title"]')
                    title = await title_elem.inner_text() if title_elem else None
                    
                    if not title:
                        continue
                    
                    # Get showtimes
                    time_elems = await elem.query_selector_all('.showtime, .time, button')
                    showtimes = []
                    for t in time_elems:
                        time_text = await t.inner_text()
                        if ':' in time_text or 'PM' in time_text or 'AM' in time_text:
                            showtimes.append({'time': time_text.strip(), 'availability': 'Available'})
                    
                    # Get format
                    format_elem = await elem.query_selector('.format, [class*="imax"], [class*="3d"]')
                    format_text = await format_elem.inner_text() if format_elem else None
                    
                    movies.append({
                        'title': title.strip(),
                        'format': format_text.strip() if format_text else 'Standard',
                        'showtimes': showtimes
                    })
                    
                except:
                    continue
            
            if movies:
                break
                
        except:
            continue
    
    return movies


async def extract_yoga_classes(page):
    """Extract yoga classes from CorePower page"""
    
    # Try to find class containers
    selectors = [
        '[class*="class"][class*="card"]',
        '.schedule-item',
        '[data-testid*="class"]',
        '.yoga-class'
    ]
    
    classes = []
    
    for selector in selectors:
        try:
            await page.wait_for_selector(selector, timeout=10000)
            elements = await page.query_selector_all(selector)
            
            for elem in elements[:30]:  # First 30 classes
                try:
                    # Get class name
                    name_elem = await elem.query_selector('h3, h4, .class-name, [class*="title"]')
                    name = await name_elem.inner_text() if name_elem else None
                    
                    if not name:
                        continue
                    
                    # Get time
                    time_elem = await elem.query_selector('.time, [class*="time"], [class*="schedule"]')
                    time_text = await time_elem.inner_text() if time_elem else None
                    
                    # Get instructor
                    instructor_elem = await elem.query_selector('.instructor, [class*="teacher"]')
                    instructor = await instructor_elem.inner_text() if instructor_elem else None
                    
                    classes.append({
                        'name': name.strip(),
                        'time': time_text.strip() if time_text else 'TBD',
                        'instructor': instructor.strip() if instructor else 'TBD'
                    })
                    
                except:
                    continue
            
            if classes:
                break
                
        except:
            continue
    
    return classes


async def scrape_all():
    """Scrape all configured sources"""
    
    all_results = {
        'timestamp': datetime.now().isoformat(),
        'sources': []
    }
    
    for source_key, source_config in SOURCES.items():
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Scraping: {source_config['name']}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        
        result = await scrape_with_browserless(source_key, source_config)
        all_results['sources'].append(result)
    
    return all_results


if __name__ == '__main__':
    import asyncio
    
    print("="*70, file=sys.stderr)
    print("Browserless.io Showtime Scraper", file=sys.stderr)
    print(f"Endpoint: {BROWSERLESS_URL}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    results = asyncio.run(scrape_all())
    
    # Save results
    output_file = '/tmp/browserless_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"Results saved to: {output_file}", file=sys.stderr)
    for source in results['sources']:
        print(f"  {source['source']}: {len(source['data'])} items", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    print(json.dumps(results, indent=2))
