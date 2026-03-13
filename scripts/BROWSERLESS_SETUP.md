# Browserless/Playwright Showtime Scraper - Setup Guide

## Current Status

### Environment Issues
- **Playwright**: Not installed in the active Python environment
- **Browserless**: No BROWSERLESS_URL configured in environment
- **Chromium**: Would need separate installation for local Playwright

### What We Have Working
✅ **Scrapling** - Successfully bypasses Cloudflare  
✅ **Faster-whisper** - Voice transcription working  
✅ **UnifiedMovieCard** - Dashboard component ready  

## To Complete Browserless Integration

### Step 1: Get Browserless Access
You need either:
- **Browserless.io account** (cloud): Get API token from https://browserless.io/
- **Self-hosted Browserless** (Docker): Run locally

### Step 2: Configure Environment
Add to your environment:
```bash
export BROWSERLESS_URL="wss://chrome.browserless.io"  # or your self-hosted URL
export BROWSERLESS_TOKEN="your-token-here"  # if using authenticated endpoint
```

### Step 3: Install Dependencies
```bash
# Install Playwright
pip install playwright

# Install browsers
playwright install chromium
```

### Step 4: Run Scraper
```bash
python3 /data/.openclaw/workspace/clawd-mission-control-v2/scripts/showtimes_browserless.py
```

## Alternative: Use Existing Scrapling Approach

Since Scrapling is already working for Cloudflare bypass, we can extend it for full DOM scraping:

### Option A: Extended Wait Strategy
Increase wait times and use page interactions:
```python
page = StealthyFetcher.fetch(
    url,
    solve_cloudflare=True,
    headless=True,
    timeout=180000,  # 3 minutes
    wait=30000,      # 30 second wait
    network_idle=True
)
```

### Option B: User Interaction Simulation
Simulate clicks to load dynamic content:
```python
# Click on date selector, movie cards, etc.
# Extract from fully rendered DOM
```

## Recommendation

Given the time invested and environment constraints:

1. **Short-term**: Set up Browserless.io (5 min signup) and use the provided script
2. **Long-term**: Consider a hybrid approach - Scrapling for simple sites, Browserless for complex SPAs

## Files Created

- `/scripts/showtimes_browserless.py` - Browserless-powered scraper
- `/scripts/showtimes_playwright.py` - Local Playwright scraper (fallback)
- This README

## Next Steps

1. Get Browserless URL/token
2. Add to environment
3. Run scraper
4. Wire into API endpoint
5. Update dashboard

---
*Created: March 13, 2026*
