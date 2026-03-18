# YouTube Video Analysis Guide

## Current Workaround (No API Key Needed)

Since I cannot directly access YouTube videos, here's how to get video content:

### Method 1: Browser Coworking (Recommended)
1. Open YouTube video in browser coworking session
2. I can watch alongside you and extract information
3. Works for any video, no API key needed

### Method 2: YouTube Transcript Services
Use external tools to get transcripts, then share with me:

**Tools:**
- YouTube Transcript (browser extension)
- downsub.com
- youtubetranscript.com

**Then:** Paste transcript here for analysis

### Method 3: YouTube Data API (For Metadata)
If you want automated metadata extraction:

```bash
# Set up YouTube Data API v3
1. Go to https://console.cloud.google.com/apis/credentials
2. Create API Key
3. Enable YouTube Data API v3
4. Export key: export YOUTUBE_API_KEY="your_key"
```

**Then I can use:**
- `web_fetch` to call API endpoints
- Extract title, description, stats, etc.

## For Your ESP32 Video

Since you shared `https://youtu.be/SAXXSR6XEmU`, I can help you once you:

1. **Option A:** Open it in our browser coworking session (I can watch and analyze)
2. **Option B:** Copy-paste the transcript here
3. **Option C:** Share key points from the video

## Future Enhancement

A proper YouTube skill would need:
- YouTube Data API key for metadata
- youtube-transcript library for captions
- Video download capability (yt-dlp) for offline analysis

Want to try Method 1 (browser coworking) for the ESP32 video?
