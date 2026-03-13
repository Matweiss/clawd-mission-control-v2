#!/usr/bin/env python3
"""
Local Playwright scraper for Regal and CorePower
Runs browser automation locally without Browserless
"""

import json
import sys
import os
from datetime import datetime

SOURCES = {
    'regal_sherman_oaks': {
        'name': 'Regal Sherman Oaks Galleria',
        'url': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'source': 'Regal'
    },
    'corepower_schedule': {
        'name': 'CorePower Yoga Schedule',
        'url': 'https://www.corepoweryoga.com/yoga-schedules',
        'source': 'CorePower'
    }
}

async def scrape_local(source_key, source_config):
    """Scrape using local Playwright"""
    
    from playwright.async_api import async_playwright
    
    results = {
        'source': source_config['source'],
        'name': source_config['name'],
        'url': source_config['url'],
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False,
        'error': None
    }
    
    try:
        async with async_playwright() as p:
            print(f"[{source_key}] Launching local browser...", file=sys.stderr)
            
            # Launch local browser
            browser = await p.chromium.launch(headless=True)
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            # Navigate
            print(f"[{source_key}] Loading {source_config['url']}...", file=sys.stderr)
            
            response = await page.goto(
                source_config['url'],
                wait_until='domcontentloaded',
                timeout=60000
            )
            
            print(f"[{source_key}] Status: {response.status if response else 'unknown'}", file=sys.stderr)
            
            # Wait for JS to execute
            await page.wait_for_timeout(8000)
            
            # Get page content
            content = await page.content()
            print(f"[{source_key}] Content length: {len(content)}", file=sys.stderr)
            
            # Save for inspection
            with open(f'/tmp/{source_key}_content.html', 'w') as f:
                f.write(content)
            
            # Try to extract movie data
            # Look for common patterns
            import re
            
            # Find movie titles (capitalized words before times)
            title_pattern = r'\b([A-Z][a-zA-Z\s\':]+)\b(?=.*?\d{1,2}:\d{2})'
            titles = re.findall(title_pattern, content)
            
            # Find times
            time_pattern = r'\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)'
            times = re.findall(time_pattern, content)
            
            results['found_titles'] = list(set(titles))[:15]
            results['found_times'] = list(set(times))[:20]
            results['success'] = len(titles) > 0 or len(times) > 0
            
            print(f"[{source_key}] Found {len(results['found_titles'])} titles, {len(results['found_times'])} times", file=sys.stderr)
            
            await browser.close()
            
    except Exception as e:
        import traceback
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        print(f"[{source_key}] ✗ Error: {e}", file=sys.stderr)
    
    return results


async def scrape_all():
    """Scrape all sources"""
    
    all_results = {
        'timestamp': datetime.now().isoformat(),
        'sources': []
    }
    
    for source_key, source_config in SOURCES.items():
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Scraping: {source_config['name']}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        
        result = await scrape_local(source_key, source_config)
        all_results['sources'].append(result)
    
    return all_results


if __name__ == '__main__':
    import asyncio
    
    print("="*70, file=sys.stderr)
    print("Local Playwright Scraper", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    results = asyncio.run(scrape_all())
    
    # Save results
    output_file = '/tmp/local_scrape_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"Results saved to: {output_file}", file=sys.stderr)
    for source in results['sources']:
        print(f"  {source['source']}: {len(source.get('found_titles', []))} titles, {len(source.get('found_times', []))} times", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    print(json.dumps(results, indent=2))
