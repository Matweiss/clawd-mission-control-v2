# Auto Video Analyzer Setup Guide

## Goal
Enable automatic YouTube video and upload analysis with VLM (Vision Language Model)

## Architecture

```
YouTube URL → Download (yt-dlp) → Extract Frames (ffmpeg) → Vision Analysis (VLM) → Summary
Video File → Upload → Extract Frames (ffmpeg) → Vision Analysis (VLM) → Summary
```

## Step 1: Install Dependencies

### On Your Mac

```bash
# Install yt-dlp for YouTube downloads
brew install yt-dlp

# Install ffmpeg (already done)
brew install ffmpeg

# Verify installations
yt-dlp --version
ffmpeg -version
```

## Step 2: Create Analysis Script

Create `~/Documents/obsidian-memory/scripts/analyze-video.sh`:

```bash
#!/bin/bash

# Auto Video Analyzer with VLM
# Usage: ./analyze-video.sh <youtube_url_or_video_path> [analysis_type]

SOURCE="$1"
TYPE="${2:-general}"
OUTPUT_DIR="/tmp/video-analysis/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR/frames"

echo "🔍 Analyzing: $SOURCE"
echo "📊 Type: $TYPE"

# Download if YouTube URL
if [[ "$SOURCE" == *"youtube.com"* ]] || [[ "$SOURCE" == *"youtu.be"* ]]; then
    echo "📥 Downloading from YouTube..."
    VIDEO_ID=$(echo "$SOURCE" | grep -oP '(?<=v=|be/)[^&]+')
    VIDEO_PATH="$OUTPUT_DIR/video.mp4"
    yt-dlp -f "best[height<=720]" -o "$VIDEO_PATH" "$SOURCE"
else
    VIDEO_PATH="$SOURCE"
fi

# Extract frames
echo "🎞️ Extracting frames..."
ffmpeg -i "$VIDEO_PATH" -vf "fps=1/5,scale=1280:720" -vframes 20 "$OUTPUT_DIR/frames/frame_%03d.jpg"

# List extracted frames
echo "📸 Extracted frames:"
ls -la "$OUTPUT_DIR/frames/"

echo ""
echo "✅ Ready for VLM analysis!"
echo "📁 Frames location: $OUTPUT_DIR/frames/"
echo ""
echo "Next steps:"
echo "1. Upload key frames to Telegram"
echo "2. I'll analyze each frame"
echo "3. I'll provide full video summary"
```

Make it executable:
```bash
chmod +x ~/Documents/obsidian-memory/scripts/analyze-video.sh
```

## Step 3: Usage

### Analyze YouTube Video
```bash
~/Documents/obsidian-memory/scripts/analyze-video.sh "https://youtu.be/xwCaQstGaOM" layout
```

### Analyze Local Video
```bash
~/Documents/obsidian-memory/scripts/analyze-video.sh ~/Movies/home_walkthrough.mp4 layout
```

### Analysis Types
- `layout` - Room/spatial analysis (for home walkthroughs)
- `objects` - Object detection and tracking
- `people` - People detection and actions
- `general` - General scene description

## Step 4: Upload Frames for Analysis

After running the script:

```bash
# List extracted frames
ls /tmp/video-analysis/*/frames/

# Upload every 3rd frame to Telegram for analysis
# Or upload all and I'll analyze the sequence
```

## Future: Full Automation

To make this fully automatic (no manual upload):

### Option A: Cloud Vision API
- Use Claude Vision, GPT-4V, or Gemini
- Script sends frames to API
- Returns analysis automatically

### Option B: Local VLM
- Set up Ollama with LLaVA or similar
- Run VLM locally on your Mac
- Script processes all frames automatically

### Option C: OpenClaw Node VLM
- Requires node with GPU
- Extension handles download → frames → VLM → summary
- Fully integrated workflow

## Example Workflow

**For your home walkthrough:**

```bash
# 1. Run analysis
~/Documents/obsidian-memory/scripts/analyze-video.sh \
  "https://youtu.be/xwCaQstGaOM" \
  layout

# 2. Script outputs:
#    📁 Frames: /tmp/video-analysis/20250318-215500/frames/
#    📸 frame_001.jpg through frame_048.jpg

# 3. Upload frame_001, frame_010, frame_020, frame_030, frame_040 to Telegram

# 4. I analyze each and build complete home layout

# 5. I design optimal UWB anchor placement
```

## Next Steps

1. **Install yt-dlp:** `brew install yt-dlp`
2. **Create the script** (copy above)
3. **Test with your video**
4. **Upload frames** to Telegram
5. **I'll analyze and map your home!**

Want to run this now for your home walkthrough video?
