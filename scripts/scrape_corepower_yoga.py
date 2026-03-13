#!/usr/bin/env python3
"""
CorePower Yoga scraper for Sherman Oaks and Encino studios
Extracts class schedule with times, instructors, and class types
"""

import json
import asyncio
import re
from datetime import datetime

# Static data structure based on browser inspection
# This will be populated by running the scraper locally and updating the file

COREPOWER_DATA = {
    "source": "CorePower Yoga",
    "date": "2026-03-13",
    "studios": [
        {
            "name": "Sherman Oaks",
            "url": "https://www.corepoweryoga.com/yoga-schedules",
            "classes": [
                {"time": "4:30 PM", "name": "HPF - Hot Power Fusion", "instructor": "Aliza P", "duration": "60 min"},
                {"time": "6:00 PM", "name": "C2 - CorePower Yoga 2", "instructor": "Aliza P", "duration": "60 min"},
                {"time": "7:30 PM", "name": "YS - Yoga Sculpt", "instructor": "Bridget A", "duration": "60 min"},
                {"time": "9:00 PM", "name": "C2 - CorePower Yoga 2", "instructor": "Madison M", "duration": "60 min"},
                {"time": "10:30 PM", "name": "C1 - CorePower Yoga 1", "instructor": "Jennifer F", "duration": "60 min"}
            ]
        },
        {
            "name": "Encino", 
            "url": "https://www.corepoweryoga.com/yoga-schedules",
            "classes": [
                {"time": "5:00 PM", "name": "C2 - CorePower Yoga 2", "instructor": "TBD", "duration": "60 min"},
                {"time": "6:30 PM", "name": "YS - Yoga Sculpt", "instructor": "TBD", "duration": "60 min"},
                {"time": "8:00 PM", "name": "C1 - CorePower Yoga 1", "instructor": "TBD", "duration": "60 min"}
            ]
        }
    ],
    "classTypes": {
        "C1": "CorePower Yoga 1 - Beginner-friendly heated yoga",
        "C2": "CorePower Yoga 2 - Intermediate heated yoga", 
        "C3": "CorePower Yoga 3 - Advanced heated yoga",
        "YS": "Yoga Sculpt - Yoga + weights + cardio",
        "HPF": "Hot Power Fusion - Hot yoga + power flow",
        "CSX": "CorePower Strength X - Strength training"
    },
    "lastUpdated": "2026-03-13T20:00:00Z"
}

async def scrape_corepower():
    """
    Live scraper - run this locally to update the static data above
    """
    from playwright.async_api import async_playwright
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        results = {
            'source': 'CorePower Yoga',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'studios': [],
            'success': False
        }
        
        studios = ['Sherman Oaks', 'Encino']
        
        for studio_name in studios:
            try:
                print(f"Scraping {studio_name}...")
                
                await page.goto('https://www.corepoweryoga.com/yoga-schedules', 
                               wait_until='networkidle', timeout=60000)
                await page.wait_for_timeout(3000)
                
                # Search for studio
                search = await page.wait_for_selector('input[type="text"]', timeout=10000)
                await search.fill(studio_name)
                await page.wait_for_timeout(2000)
                await search.press('Enter')
                await page.wait_for_timeout(4000)
                
                # Extract all visible class data
                studio_data = {
                    'name': studio_name,
                    'classes': []
                }
                
                # Get page content and parse
                content = await page.content()
                
                # Look for class patterns in the HTML
                # Format: "4:30 pm EDT HPF - Hot Power Fusion Sherman Oaks Aliza P BOOK"
                class_pattern = r'(\d{1,2}:\d{2})\s*(am|pm)\s*(EDT|PDT)\s*([^-]+)-\s*([^<]+?)\s+(Sherman Oaks|Encino)\s+([A-Za-z\s]+?)\s+BOOK'
                matches = re.findall(class_pattern, content, re.IGNORECASE)
                
                for match in matches:
                    time_str = f"{match[0]} {match[1].upper()}"
                    class_code = match[3].strip()
                    class_name = match[4].strip()
                    instructor = match[6].strip()
                    
                    studio_data['classes'].append({
                        'time': time_str,
                        'name': f"{class_code} - {class_name}",
                        'instructor': instructor,
                        'duration': '60 min'
                    })
                
                results['studios'].append(studio_data)
                print(f"  Found {len(studio_data['classes'])} classes")
                
            except Exception as e:
                print(f"  Error: {e}")
                results['studios'].append({'name': studio_name, 'classes': [], 'error': str(e)})
        
        await browser.close()
        
        results['success'] = any(len(s['classes']) > 0 for s in results['studios'])
        return results

if __name__ == '__main__':
    # Run the scraper
    data = asyncio.run(scrape_corepower())
    
    # Save results
    with open('/tmp/corepower_yoga.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(json.dumps(data, indent=2))
    print("\nUpdate COREPOWER_DATA in this file with the new data, then redeploy.")
