#!/usr/bin/env python3
"""
Fetch and analyze the working /api/theatres endpoint
"""

import sys
sys.path.insert(0, '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages')

from scrapling.fetchers import StealthyFetcher

url = "https://www.regmovies.com/api/theatres"

print(f"Fetching: {url}", file=sys.stderr)

response = StealthyFetcher.fetch(
    url,
    solve_cloudflare=True,
    headless=True,
    timeout=60000
)

print(f"Status: {response.status}", file=sys.stderr)
print(f"Content-Type: {response.headers.get('content-type', 'unknown')}", file=sys.stderr)

content = str(response)
print(f"\nContent length: {len(content)}", file=sys.stderr)
print(f"\nFirst 1000 characters:", file=sys.stderr)
print(content[:1000], file=sys.stderr)

# Save full content
with open('/tmp/regal_api_theatres.html', 'w') as f:
    f.write(content)

print(f"\n\nFull content saved to /tmp/regal_api_theatres.html", file=sys.stderr)
