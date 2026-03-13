#!/usr/bin/env python3
"""
Refined Regal showtime scraper
Extracts actual movie titles and showtimes from the SPA
"""

import json
import sys
import os
from datetime import datetime

async def scrape_regal_refined():
    """Scrape Regal with refined extraction"""
    
    from playwright.async_api import async_playwright
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'url': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False,
        'error': None
    }
    
    try:
        async with async_playwright() as p:
            print("Launching browser...", file=sys.stderr)
            browser = await p.chromium.launch(headless=True)
            
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            print(f"Loading {results['url']}...", file=sys.stderr)
            response = await page.goto(
                results['url'],
                wait_until='domcontentloaded',
                timeout=60000
            )
            
            print(f"Status: {response.status if response else 'unknown'}", file=sys.stderr)
            
            # Wait for movie cards to render
            await page.wait_for_timeout(10000)
            
            # Extract movie data using page.evaluate
            movies = await page.evaluate('''() => {
                const movies = [];
                
                // Look for movie cards/containers
                const movieCards = document.querySelectorAll('[data-testid*="movie"], .movie-card, [class*="movie"][class*="card"]');
                
                movieCards.forEach(card => {
                    // Get title - look for h2, h3, or specific title classes
                    const titleEl = card.querySelector('h2, h3, [class*="title"], [data-testid*="title"]');
                    const title = titleEl ? titleEl.textContent.trim() : null;
                    
                    if (!title || title.length < 2) return;
                    
                    // Get showtimes - look for time buttons or links
                    const timeEls = card.querySelectorAll('button, a, [class*="time"], [class*="showtime"]');
                    const showtimes = [];
                    
                    timeEls.forEach(el => {
                        const text = el.textContent.trim();
                        // Match time patterns like "7:00pm", "1:40pm", etc.
                        if (/^\\d{1,2}:\\d{2}(am|pm|AM|PM)$/.test(text)) {
                            showtimes.push({
                                time: text,
                                availability: 'Available'
                            });
                        }
                    });
                    
                    // Get format (IMAX, 3D, etc.)
                    const formatEl = card.querySelector('[class*="format"], [class*="imax"], [class*="3d"]');
                    const format = formatEl ? formatEl.textContent.trim() : 'Standard';
                    
                    // Get poster image
                    const imgEl = card.querySelector('img');
                    const poster = imgEl ? imgEl.src : null;
                    
                    movies.push({
                        title: title,
                        format: format,
                        showtimes: showtimes,
                        poster: poster
                    });
                });
                
                return movies;
            }''');
            
            results['movies'] = movies
            results['success'] = len(movies) > 0
            
            print(f"✓ Extracted {len(movies)} movies", file=sys.stderr)
            
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
    print("Refined Regal Scraper", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    results = asyncio.run(scrape_regal_refined())
    
    # Save results
    output_file = '/tmp/regal_refined.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{'='*70}", file=sys.stderr)
    print(f"Results saved to: {output_file}", file=sys.stderr)
    print(f"Movies found: {len(results['movies'])}", file=sys.stderr)
    print("="*70, file=sys.stderr)
    
    print(json.dumps(results, indent=2))
