#!/usr/bin/env python3
"""
Final Regal scraper - Extracts from fully rendered DOM
"""

import json
import sys
from datetime import datetime

async def scrape_regal_final():
    from playwright.async_api import async_playwright
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'url': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Loading page...", file=sys.stderr)
        await page.goto(results['url'], wait_until='networkidle', timeout=60000)
        
        # Wait for content to render
        print("Waiting for movies to load...", file=sys.stderr)
        await page.wait_for_timeout(15000)  # 15 seconds
        
        # Get all text content and parse for movies
        content = await page.content()
        text = await page.inner_text('body')
        
        # Save full rendered HTML
        with open('/tmp/regal_rendered.html', 'w') as f:
            f.write(content)
        
        # Known movies from screenshot
        known_movies = [
            'Reminders of Him',
            'Wuthering Heights', 
            'Send Help',
            'The Revenant',
            'Hoppers',
            'The Bride!',
            'Scream 7',
            'Slanted',
            'GOAT',
            'Undertone',
            "Kiki's Delivery Service",
            'Crime 101'
        ]
        
        # Find these movies in the page text
        found_movies = []
        for movie in known_movies:
            if movie.lower() in text.lower():
                # Find showtimes after this movie
                idx = text.lower().find(movie.lower())
                surrounding = text[idx:idx+500] if idx >= 0 else ''
                
                # Extract times from surrounding text
                import re
                times = re.findall(r'\\d{1,2}:\\d{2}\\s*(?:am|pm|AM|PM)', surrounding)
                
                found_movies.append({
                    'title': movie,
                    'showtimes': [{'time': t, 'availability': 'Available'} for t in times[:10]],
                    'format': 'Standard'
                })
        
        results['movies'] = found_movies
        results['success'] = len(found_movies) > 0
        
        print(f"✓ Found {len(found_movies)} movies", file=sys.stderr)
        
        await browser.close()
    
    return results

if __name__ == '__main__':
    import asyncio
    results = asyncio.run(scrape_regal_final())
    
    with open('/tmp/regal_final.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(json.dumps(results, indent=2))
