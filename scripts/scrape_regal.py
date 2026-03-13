#!/usr/bin/env python3
"""
Scrape Regal Sherman Oaks Galleria showtimes using Scrapling
"""

import json
import sys
from scrapling import Fetcher

def scrape_regal_showtimes():
    """Scrape showtimes from Regal website"""
    
    # Initialize fetcher with stealth mode (new API)
    fetcher = Fetcher()
    fetcher.configure(stealthy=True)
    
    # Regal Sherman Oaks Galleria URL
    url = "https://www.regmovies.com/theatres/regal-sherman-oaks-galleria/0628"
    
    try:
        # Fetch the page with JavaScript rendering
        page = fetcher.get(url, wait_for='.movie-list, .showtimes, .movie-card', timeout=30000)
        
        # Extract movie data
        movies = []
        
        # Try multiple selectors for movie containers
        movie_selectors = [
            '.movie-card',
            '.movie-list .movie',
            '[data-movie-id]',
            '.showtime-movie',
            '.film-card'
        ]
        
        for selector in movie_selectors:
            movie_elements = page.css(selector)
            if movie_elements:
                print(f"Found {len(movie_elements)} movies with selector: {selector}", file=sys.stderr)
                
                for elem in movie_elements:
                    try:
                        # Extract title
                        title_selectors = ['h2', 'h3', '.movie-title', '.title', '[data-title]']
                        title = None
                        for ts in title_selectors:
                            title_elem = elem.css_first(ts)
                            if title_elem:
                                title = title_elem.text().strip()
                                break
                        
                        if not title:
                            continue
                        
                        # Extract showtimes
                        showtime_selectors = ['.showtime', '.time', '[data-showtime]', '.showtimes li']
                        showtimes = []
                        for sts in showtime_selectors:
                            time_elems = elem.css(sts)
                            if time_elems:
                                showtimes = [t.text().strip() for t in time_elems if t.text().strip()]
                                break
                        
                        # Extract movie ID from data attribute or URL
                        movie_id = elem.attr('data-movie-id') or elem.attr('id') or hash(title) % 100000
                        
                        movies.append({
                            'id': int(movie_id),
                            'title': title,
                            'showtimes': showtimes,
                            'poster_path': None  # Would need to extract from img src
                        })
                        
                    except Exception as e:
                        print(f"Error parsing movie: {e}", file=sys.stderr)
                        continue
                
                break  # Stop if we found movies with this selector
        
        result = {
            'theater': 'Regal Sherman Oaks Galleria',
            'url': url,
            'movies': movies,
            'count': len(movies),
            'success': True
        }
        
        print(json.dumps(result, indent=2))
        return result
        
    except Exception as e:
        error_result = {
            'theater': 'Regal Sherman Oaks Galleria',
            'url': url,
            'movies': [],
            'count': 0,
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result, indent=2))
        return error_result

if __name__ == '__main__':
    scrape_regal_showtimes()
