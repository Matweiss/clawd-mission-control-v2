# GPT-4 Vision Auto Video Analyzer

## Overview
Fully automated video analysis using OpenAI GPT-4 Vision API.

## Prerequisites

### 1. OpenAI API Key
Must be set in environment:
```bash
export OPENAI_API_KEY="sk-..."
```

Or in OpenClaw config at `~/.openclaw/openclaw.json`:
```json
{
  "env": {
    "OPENAI_API_KEY": "sk-..."
  }
}
```

### 2. Install Dependencies
```bash
brew install yt-dlp ffmpeg
```

## Full Auto-Analysis Script

Create `~/Documents/obsidian-memory/scripts/auto-video-gpt4v.sh`:

```bash
#!/bin/bash

# GPT-4 Vision Auto Video Analyzer
# Usage: ./auto-video-gpt4v.sh <youtube_url_or_video_path> [analysis_type]

SOURCE="$1"
TYPE="${2:-general}"
OUTPUT_DIR="/tmp/video-analysis/$(date +%Y%m%d-%H%M%S)"
API_KEY="${OPENAI_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set!"
    echo "Set it with: export OPENAI_API_KEY='sk-...'"
    exit 1
fi

mkdir -p "$OUTPUT_DIR/frames"

echo "🔍 Analyzing: $SOURCE"
echo "📊 Type: $TYPE"
echo ""

# Download if YouTube
if [[ "$SOURCE" == *"youtube.com"* ]] || [[ "$SOURCE" == *"youtu.be"* ]]; then
    echo "📥 Downloading from YouTube..."
    yt-dlp -f "best[height<=720]" -o "$OUTPUT_DIR/video.mp4" "$SOURCE" 2>/dev/null
    VIDEO_PATH="$OUTPUT_DIR/video.mp4"
else
    VIDEO_PATH="$SOURCE"
fi

# Extract frames
echo "🎞️ Extracting frames..."
ffmpeg -i "$VIDEO_PATH" -vf "fps=1/5,scale=1280:720" -vframes 20 "$OUTPUT_DIR/frames/frame_%03d.jpg" 2>/dev/null

FRAME_COUNT=$(ls "$OUTPUT_DIR/frames/" | wc -l)
echo "📸 Extracted $FRAME_COUNT frames"
echo ""

# Analyze each frame with GPT-4V
echo "🧠 Analyzing with GPT-4 Vision..."
echo ""

ANALYSIS_FILE="$OUTPUT_DIR/analysis.txt"
echo "Video Analysis Report" > "$ANALYSIS_FILE"
echo "====================" >> "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"
echo "Source: $SOURCE" >> "$ANALYSIS_FILE"
echo "Type: $TYPE" >> "$ANALYSIS_FILE"
echo "Frames analyzed: $FRAME_COUNT" >> "$ANALYSIS_FILE"
echo "" >> "$ANALYSIS_FILE"

for frame in "$OUTPUT_DIR/frames/"*.jpg; do
    FRAME_NAME=$(basename "$frame")
    echo "  Analyzing $FRAME_NAME..."
    
    # Prepare prompt based on analysis type
    case $TYPE in
        layout)
            PROMPT="Describe this room/space layout in detail. Include: room type, approximate dimensions if visible, door/window locations, furniture placement, and connections to other spaces. Be specific about spatial relationships."
            ;;
        objects)
            PROMPT="List all visible objects in this scene. Include: object names, approximate positions (left/center/right, foreground/background), and any notable details."
            ;;
        people)
            PROMPT="Describe any people visible: number, actions, positions, clothing, and activities. Note interactions with objects or environment."
            ;;
        *)
            PROMPT="Describe this scene comprehensively: setting, key elements, actions, and overall context."
            ;;
    esac
    
    # Convert image to base64
    IMG_BASE64=$(base64 -i "$frame")
    
    # Call GPT-4V API
    RESPONSE=$(curl -s https://api.openai.com/v1/chat/completions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{
            \"model\": \"gpt-4o\",
            \"messages\": [
                {
                    \"role\": \"user\",
                    \"content\": [
                        {\"type\": \"text\", \"text\": \"$PROMPT\"},
                        {
                            \"type\": \"image_url\",
                            \"image_url\": {
                                \"url\": \"data:image/jpeg;base64,$IMG_BASE64\"
                            }
                        }
                    ]
                }
            ],
            \"max_tokens\": 500
        }" 2>/dev/null)
    
    # Extract description
    DESCRIPTION=$(echo "$RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//;s/"$//')
    
    if [ -n "$DESCRIPTION" ]; then
        echo "### $FRAME_NAME" >> "$ANALYSIS_FILE"
        echo "$DESCRIPTION" >> "$ANALYSIS_FILE"
        echo "" >> "$ANALYSIS_FILE"
        echo "  ✅ Analyzed"
    else
        echo "  ⚠️  Failed to analyze (API error)"
    fi
    
    # Rate limiting - wait between requests
    sleep 0.5
done

echo ""
echo "✅ Analysis complete!"
echo "📁 Report saved to: $OUTPUT_DIR/analysis.txt"
echo ""
echo "Preview:"
head -50 "$OUTPUT_DIR/analysis.txt"
```

Make executable:
```bash
chmod +x ~/Documents/obsidian-memory/scripts/auto-video-gpt4v.sh
```

## Usage

### Set API Key
```bash
export OPENAI_API_KEY="sk-your-key-here"
```

### Analyze YouTube Video
```bash
~/Documents/obsidian-memory/scripts/auto-video-gpt4v.sh \
  "https://youtu.be/xwCaQstGaOM" \
  layout
```

### Analyze Local Video
```bash
~/Documents/obsidian-memory/scripts/auto-video-gpt4v.sh \
  ~/Movies/home_walkthrough.mp4 \
  layout
```

## Output

Script generates:
- Extracted frames: `/tmp/video-analysis/20250318-.../frames/`
- Full analysis: `/tmp/video-analysis/20250318-.../analysis.txt`

## Cost Estimate

| Video Length | Frames | Cost (GPT-4o) |
|--------------|--------|---------------|
| 2 minutes | 24 frames | ~$0.12 |
| 4 minutes | 48 frames | ~$0.24 |
| 10 minutes | 120 frames | ~$0.60 |

*Based on ~$0.005 per low-res image*

## Integration with OpenClaw

I can create an OpenClaw skill that:
1. Receives YouTube URL or video upload
2. Calls this script automatically
3. Returns formatted analysis to chat
4. Syncs report to your Obsidian vault

Want me to create the full OpenClaw integration skill?
