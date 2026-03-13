#!/usr/bin/env python3
"""
Fandango showtime scraper for Regal Sherman Oaks Galleria
Uses local Playwright to extract showtimes from Fandango's theater page
"""

import json
import sys
import re
from datetime import datetime

async def scrape_fandango_regal():
    """Scrape Regal Sherman Oaks from Fandango"""
    
    from playwright.async_api import async_playwright
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'officialUrl': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'source': 'Fandango',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False,
        'error': None
    }
    
    url = 'https://www.fandango.com/regal-sherman-oaks-galleria-aauri/theater-page'
    
    try:
        async with async_playwright() as p:
            print(f"Launching browser for Fandango...", file=sys.stderr)
            browser = await p.chromium.launch(headless=True)
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            print(f"Loading: {url}", file=sys.stderr)
            response = await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            
            print(f"Status: {response.status if response else 'unknown'}", file=sys.stderr)
            
            # Wait for showtime content
            await page.wait_for_timeout(8000)
            
            # Get page content
            content = await page.content()
            text = await page.inner_text('body')
            
            print(f"Content length: {len(content)}", file=sys.stderr)
            
            # Save for debugging
            with open('/tmp/fandango_regal.html', 'w') as f:
                f.write(content)
            
            # Extract movies using page.evaluate
            movies = await page.evaluate('''() => {
                const movies = [];
                
                // Look for movie containers
                const selectors = [
                    '[data-testid*="movie"]',
                    '.movie-showtime',
                    '.fd-movie',
                    '[class*="movie"]',
                    'article'
                ];
                
                for (const selector of selectors) {
                    const cards = document.querySelectorAll(selector);
                    
                    for (const card of cards) {
                        // Get title
                        const titleEl = card.querySelector('h2, h3, h4, .movie-title, [class*="title"]');
                        const title = titleEl ? titleEl.textContent.trim() : null;
                        
                        if (!title || title.length < 2) continue;
                        
                        // Get showtimes
                        const times = [];
                        const timeEls = card.querySelectorAll('.showtime, .time, button, [class*="time"]');
                        
                        for (const el of timeEls) {
                            const text = el.textContent.trim();
                            if (/^\\d{1,2}:\\d{2}/.test(text)) {
                                times.push(text);
                            }
                        }
                        
                        // Get format
                        const formatEl = card.querySelector('.format, [class*="format"], [class*="imax"]');
                        const format = formatEl ? formatEl.textContent.trim() : 'Standard';
                        
                        if (times.length > 0) {
                            movies.push({
                                title: title,
                                format: format,
                                showtimes: times
                            });
                        }
                    }
                    
                    if (movies.length > 0) break;
                }
                
                return movies;
            }''');
            
            results['movies'] = movies
            results['success'] = len(movies) > 0
            
            print(f"✓ Found {len(movies)} movies with showtimes", file=sys.stderr)
            
            await browser.close()
            
    except Exception as e:
        import traceback
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        print(f"✗ Error: {e}", file=sys.stderr)
    
    return results


if __name__ == '__main__':
    import asyncio
    
    print("="*70, file=sys.stderr)
    print("Fandango Regal Scraper", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    results = asyncio.run(scrape_fandango_regal())
    
    # Save results
    output_file = '/tmp/fandango_regal.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"Results: {output_file}", file=sys.stderr)
    print(f"Movies: {len(results['movies'])}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    print(json.dumps(results, indent=2))
