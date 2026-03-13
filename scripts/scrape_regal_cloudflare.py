#!/usr/bin/env python3
"""
Regal SPA DOM Scraper - Full browser automation with explicit waits
Extracts showtimes from rendered DOM, not JSON APIs
"""

import json
import sys
import time

sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

def scrape_regal_dom():
    """
    Scrape Regal Sherman Oaks by:
    1. Loading theater page with full JS execution
    2. Waiting for showtime containers to render
    3. Extracting data directly from DOM
    """
    
    results = {
        'theater': 'Regal Sherman Oaks Galleria',
        'url': 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria/0628',
        'date': time.strftime('%Y-%m-%d'),
        'movies': [],
        'selectors_tried': [],
        'dom_sample': '',
        'success': False,
        'error': None
    }
    
    try:
        print("=" * 70, file=sys.stderr)
        print("Regal SPA DOM Scraper - Starting", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        
        # Step 1: Load page with full browser context
        print("\n[1/4] Loading theater page with JS execution...", file=sys.stderr)
        print(f"      URL: {results['url']}", file=sys.stderr)
        
        # Use StealthyFetcher with extended wait for SPA rendering
        page = StealthyFetcher.fetch(
            results['url'],
            solve_cloudflare=True,
            headless=True,
            network_idle=True,      # Wait for network to be idle
            timeout=120000,         # 2 minute timeout
            wait=10000              # Wait 10 seconds after load
        )
        
        print(f"\n      Page loaded - Status: {page.status}", file=sys.stderr)
        print(f"      Final URL: {page.url}", file=sys.stderr)
        
        if page.status != 200:
            results['error'] = f"Page returned status {page.status}"
            return results
        
        # Step 2: Try multiple selectors for movie/showtime containers
        print("\n[2/4] Searching for showtime containers in rendered DOM...", file=sys.stderr)
        
        # Common selectors for movie/showtime data
        selectors_to_try = [
            # Movie cards/containers
            '.movie-card',
            '[data-testid="movie-card"]',
            '.film-card',
            '.showtime-movie',
            '[class*="movie"]',
            '[class*="Movie"]',
            
            # Showtime containers
            '.showtimes-container',
            '.showtime-list',
            '[class*="showtime"]',
            '[class*="Showtime"]',
            
            # Grid/list containers
            '.movies-grid',
            '.movies-list',
            '#movies-container',
            '[data-movies]',
            
            # Generic content
            'article',
            '.content-card',
        ]
        
        found_selector = None
        movie_elements = []
        
        for selector in selectors_to_try:
            results['selectors_tried'].append(selector)
            try:
                print(f"      Trying: {selector}...", file=sys.stderr)
                elements = page.css(selector)
                
                if elements and len(elements) > 0:
                    print(f"      ✓ Found {len(elements)} elements!", file=sys.stderr)
                    found_selector = selector
                    movie_elements = elements
                    break
                
            except Exception as e:
                print(f"      ✗ Error with {selector}: {e}", file=sys.stderr)
                continue
        
        if not found_selector:
            print("\n      ⚠ No movie containers found with standard selectors", file=sys.stderr)
            print("      Capturing DOM sample for analysis...", file=sys.stderr)
            
            # Get page content for debugging
            page_html = str(page)
            results['dom_sample'] = page_html[:3000]  # First 3000 chars
            
            # Try to find any content divs
            print("      Searching for any content containers...", file=sys.stderr)
            content_selectors = ['div', 'section', 'main']
            
            for sel in content_selectors:
                try:
                    elems = page.css(sel)
                    if len(elems) > 5:  # If we have multiple elements
                        print(f"      Found {len(elems)} {sel} elements", file=sys.stderr)
                        # Check if any contain movie-like text
                        for i, elem in enumerate(elems[:10]):
                            text = elem.text()
                            if text and len(text) > 20:
                                text_lower = text.lower()
                                if any(x in text_lower for x in ['pm', 'am', 'showtime', 'movie', 'film', 'imax']):
                                    print(f"      Potential content in {sel}[{i}]: {text[:100]}...", file=sys.stderr)
                        break
                except:
                    continue
        
        # Step 3: Extract movie data from found elements
        if movie_elements:
            print(f"\n[3/4] Extracting data from {len(movie_elements)} movie elements...", file=sys.stderr)
            
            for i, elem in enumerate(movie_elements[:20]):  # Process first 20
                try:
                    movie_data = extract_movie_from_element(elem)
                    if movie_data and movie_data.get('title'):
                        results['movies'].append(movie_data)
                        print(f"      ✓ Extracted: {movie_data['title'][:50]}", file=sys.stderr)
                except Exception as e:
                    print(f"      ✗ Error extracting movie {i}: {e}", file=sys.stderr)
                    continue
        
        # Step 4: Finalize results
        print(f"\n[4/4] Finalizing...", file=sys.stderr)
        
        results['success'] = len(results['movies']) > 0
        results['movies_count'] = len(results['movies'])
        
        if results['success']:
            print(f"\n      ✓✓ SUCCESS! Extracted {len(results['movies'])} movies", file=sys.stderr)
        else:
            print(f"\n      ⚠ No movies extracted", file=sys.stderr)
            print(f"      Selectors tried: {len(results['selectors_tried'])}", file=sys.stderr)
        
    except Exception as e:
        import traceback
        results['error'] = str(e)
        results['traceback'] = traceback.format_exc()
        print(f"\n      ✗ Fatal error: {e}", file=sys.stderr)
    
    print("\n" + "=" * 70, file=sys.stderr)
    print("Scraping Complete", file=sys.stderr)
    print("=" * 70, file=sys.stderr)
    
    return results


def extract_movie_from_element(elem):
    """Extract movie data from a DOM element"""
    
    movie = {
        'title': None,
        'format': None,
        'showtimes': []
    }
    
    # Try to extract title
    title_selectors = [
        'h2', 'h3', 'h4',
        '.movie-title', '.title', '.film-title',
        '[data-title]',
        '.name', '.movie-name'
    ]
    
    for sel in title_selectors:
        try:
            title_elem = elem.css_first(sel)
            if title_elem:
                title = title_elem.text().strip()
                if title and len(title) > 1:
                    movie['title'] = title
                    break
        except:
            continue
    
    # Try to extract format (IMAX, 3D, etc.)
    format_selectors = [
        '.format', '.movie-format',
        '[class*="format"]',
        '[class*="imax"]', '[class*="IMAX"]',
        '.tag', '.badge'
    ]
    
    for sel in format_selectors:
        try:
            format_elem = elem.css_first(sel)
            if format_elem:
                fmt = format_elem.text().strip()
                if fmt and len(fmt) > 1:
                    movie['format'] = fmt
                    break
        except:
            continue
    
    # Try to extract showtimes
    showtime_selectors = [
        '.showtime', '.time', '.show-time',
        '[class*="showtime"]',
        '[class*="time"]',
        'button', 'a'
    ]
    
    for sel in showtime_selectors:
        try:
            time_elems = elem.css(sel)
            for t_elem in time_elems:
                time_text = t_elem.text().strip()
                # Look for time patterns (e.g., "7:30 PM", "19:30")
                if time_text and (':' in time_text or 'PM' in time_text or 'AM' in time_text):
                    movie['showtimes'].append({
                        'time': time_text,
                        'availability': 'Available'  # Default
                    })
        except:
            continue
    
    return movie


if __name__ == '__main__':
    results = scrape_regal_dom()
    
    # Output JSON
    print(json.dumps(results, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if results['success'] else 1)
