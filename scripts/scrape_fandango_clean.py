#!/usr/bin/env python3
"""
Clean Fandango scraper for Regal Sherman Oaks Galleria
"""

import json
import sys
import re
from datetime import datetime

async def scrape_fandango_clean():
    from playwright.async_api import async_playwright
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'officialUrl': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'source': 'Fandango',
        'date': datetime.now().strftime('%Y-%m-%d'),
        'movies': [],
        'success': False
    }
    
    url = 'https://www.fandango.com/regal-sherman-oaks-galleria-aauri/theater-page'
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto(url, wait_until='domcontentloaded', timeout=60000)
        await page.wait_for_timeout(8000)
        
        # Extract with better cleaning
        movies_raw = await page.evaluate('''() => {
            const movies = [];
            
            // Find all movie rows
            const rows = document.querySelectorAll('.fd-movie, [data-testid*="movie"], .movie-showtime');
            
            rows.forEach(row => {
                const titleEl = row.querySelector('h3, h4, .movie-title, [class*="title"]');
                const title = titleEl ? titleEl.innerText.trim() : null;
                
                if (!title) return;
                
                // Get all time buttons/links
                const timeEls = row.querySelectorAll('a[href*="/buy-tickets"], .showtime, button');
                const times = [];
                
                timeEls.forEach(el => {
                    const text = el.innerText.trim();
                    // Clean time format
                    const clean = text.replace(/\\s+/g, ' ').trim();
                    if (/^\\d{1,2}:\\d{2}/.test(clean) || /^\\d{1,2}\\d{2}/.test(clean)) {
                        times.push(clean);
                    }
                });
                
                if (times.length > 0) {
                    movies.push({
                        title: title,
                        showtimes: [...new Set(times)] // Remove duplicates
                    });
                }
            });
            
            return movies;
        }''');
        
        # Clean and filter results
        seen_titles = set()
        for movie in movies_raw:
            title = movie['title']
            
            # Skip non-movie entries
            if any(x in title.lower() for x in ['premium format', 'format:', 'see all']):
                continue
            
            # Clean title
            title = re.sub(r'\\s+', ' ', title).strip()
            
            # Clean showtimes
            clean_times = []
            for t in movie['showtimes']:
                # Extract just the time
                match = re.search(r'(\\d{1,2}:\\d{2}[ap]?)', t.lower())
                if match:
                    time_str = match.group(1)
                    # Normalize format
                    time_str = time_str.replace('a', ' AM').replace('p', ' PM')
                    if time_str not in clean_times:
                        clean_times.append(time_str)
            
            if title not in seen_titles and len(clean_times) > 0:
                seen_titles.add(title)
                results['movies'].append({
                    'title': title,
                    'format': 'Standard',  # Could extract from page if available
                    'showtimes': sorted(clean_times)
                })
        
        results['success'] = len(results['movies']) > 0
        
        await browser.close()
    
    return results

if __name__ == '__main__':
    import asyncio
    
    results = asyncio.run(scrape_fandango_clean())
    
    with open('/tmp/fandango_clean.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(json.dumps(results, indent=2))
