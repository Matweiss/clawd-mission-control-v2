#!/usr/bin/env python3
"""
Browserless REST API scraper - Alternative approach using HTTP API
"""

import json
import sys
import os
import requests
from datetime import datetime

BROWSERLESS_TOKEN = os.environ.get('BROWSERLESS_TOKEN', '')

# Use Browserless REST API instead of WebSocket
BROWSERLESS_API = f"https://chrome.browserless.io/function?token={BROWSERLESS_TOKEN}"

def scrape_with_rest_api(url, source_name):
    """Scrape using Browserless REST API"""
    
    print(f"Scraping {source_name} via Browserless REST API...", file=sys.stderr)
    
    # JavaScript to execute in browser
    script = f'''
    async ({{ page }}) => {{
        await page.goto('{url}', {{ waitUntil: 'networkidle', timeout: 60000 }});
        await page.waitForTimeout(5000);
        
        // Extract all text content
        const content = await page.content();
        const title = await page.title();
        
        return {{
            title: title,
            url: page.url(),
            contentLength: content.length,
            hasMovies: content.toLowerCase().includes('movie') || content.toLowerCase().includes('showtime'),
            hasYoga: content.toLowerCase().includes('yoga') || content.toLowerCase().includes('class')
        }};
    }}
    '''
    
    try:
        response = requests.post(
            BROWSERLESS_API,
            json={
                'code': script,
                'context': {}
            },
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Success: {result}", file=sys.stderr)
            return result
        else:
            print(f"✗ Error {response.status_code}: {response.text[:200]}", file=sys.stderr)
            return {'error': response.text, 'status': response.status_code}
            
    except Exception as e:
        print(f"✗ Exception: {e}", file=sys.stderr)
        return {'error': str(e)}


if __name__ == '__main__':
    print("="*60, file=sys.stderr)
    print("Browserless REST API Test", file=sys.stderr)
    print("="*60, file=sys.stderr)
    
    # Test Regal
    regal_result = scrape_with_rest_api(
        'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
        'Regal'
    )
    
    print("\n" + "="*60, file=sys.stderr)
    print(json.dumps(regal_result, indent=2))
