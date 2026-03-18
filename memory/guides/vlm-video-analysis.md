# VLM Video Analyzer Skill

## Overview
Vision Language Model (VLM) based video analysis for extracting visual information from videos.

## Current Status
**Skill created but requires VLM node capability.**

## How It Would Work

### 1. Frame Extraction
```bash
ffmpeg -i video.mp4 -vf "fps=1/5" -q:v 2 frames/frame_%03d.jpg
```
Extracts 1 frame every 5 seconds from video.

### 2. VLM Analysis
Each frame analyzed with prompts like:
- "Describe this room layout and dimensions"
- "Identify furniture and objects"
- "Estimate room size and shape"
- "Note door/window locations"

### 3. Temporal Analysis
- Track movement through space
- Build spatial map from sequence
- Identify room transitions

## Requirements

### Hardware
- OpenClaw node with VLM support (GPU recommended)
- Or cloud VLM API (Claude Vision, GPT-4V, etc.)

### Software
- ffmpeg for frame extraction
- Python with PIL/OpenCV
- VLM model (LLaVA, GPT-4V, Claude, etc.)

## For Your Home Video

Once enabled, I could:
1. Extract frames every 5 seconds from your 4-minute walkthrough
2. Analyze each frame: "Describe this room, its size, and connections"
3. Build a floor plan from the sequence
4. Identify optimal UWB anchor placement points

## Alternative: Manual Frame Extraction

**You can do this now without VLM:**

```bash
# Extract frames from your video
ffmpeg -i home_walkthrough.mp4 -vf "fps=1/5,scale=1280:720" frames/out_%03d.jpg

# Upload 5-10 key frames to chat
# I'll analyze each image and build the layout
```

## Implementation Path

### Option 1: Local VLM (Advanced)
- Set up node with GPU + VLM model (LLaVA, etc.)
- Install ffmpeg on node
- Extension extracts frames → VLM processes → Results returned

### Option 2: Cloud API (Easier)
- Use Claude Vision, GPT-4V, or Gemini
- Send frames to API
- Receive analysis

### Option 3: Frame-by-Frame (Current Best)
- You extract frames using ffmpeg
- Upload images to Telegram
- I analyze each image with my existing vision capability
- I build understanding from sequence

## Recommendation

**Start with Option 3 (Frame Extraction)** — it works today:

```bash
# On your Mac
ffmpeg -i home_walkthrough.mp4 -vf "fps=1/5" ~/Desktop/home_frames/frame_%03d.jpg

# Then upload key frames (every 10-15 seconds) to this chat
```

Once I see 8-10 frames, I can map your entire house layout.

Want to try this approach?
