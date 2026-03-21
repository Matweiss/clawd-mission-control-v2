# Smart Model Router for Vision Analysis

## Goal
Automatically detect images/videos in messages and route to vision-capable models.

## Current Vision-Capable Models

| Model | Provider | Vision | Best For |
|-------|----------|--------|----------|
| **Kimi K2.5** | OpenRouter | ✅ Yes | Current default, good vision |
| **GPT-4o** | OpenAI | ✅ Yes | Best vision quality, API cost |
| **Claude 3.5 Sonnet** | OpenRouter | ✅ Yes | Excellent vision, reasoning |
| **Claude 3 Opus** | OpenRouter | ✅ Yes | Highest quality, expensive |

## Automatic Routing Logic

### Detection
```javascript
// Detect media in message
if (message.hasAttachments()) {
  const attachments = message.attachments;
  
  if (attachments.some(a => a.isImage())) {
    routeToVisionModel();
  }
  
  if (attachments.some(a => a.isVideo())) {
    extractFrames().then(routeToVisionModel);
  }
}
```

### Routing Decision Tree

```
User uploads image/video
         ↓
    [Extract frames if video]
         ↓
    [Analyze with vision model]
         ↓
┌─────────────────┬─────────────────┐
│  Simple image   │  Complex scene  │
│  analysis       │  (home layout)  │
│                 │                 │
│  → Kimi K2.5    │  → GPT-4o or    │
│    (fast, free) │    Claude       │
│                 │    (best)       │
└─────────────────┴─────────────────┘
```

## Implementation Options

### Option 1: Hook-Based Auto-Routing
Create an OpenClaw hook that intercepts messages with media:

```typescript
// hooks/smart-vision-router.ts
export const handler = async (ctx) => {
  if (ctx.message.attachments?.length > 0) {
    // Force vision model
    ctx.config.model = "openai/gpt-4o"; // or keep kimi if vision works
    
    // Add system prompt for vision analysis
    ctx.systemPrompt += "\nYou are analyzing images/video frames. Describe what you see in detail.";
  }
};
```

### Option 2: Skill-Based Detection
Create a skill that users can invoke:

```bash
# Auto-detects and analyzes
analyze-media

# Forces specific model
analyze-media --model gpt-4o
```

### Option 3: Command Override
User specifies when needed:

```bash
/model vision    # Switch to vision model
/model gpt-4o    # Use GPT-4o for this
/model kimi      # Back to default
```

## Recommended Setup

### For Your Use Case (Video Analysis)

**Auto-extract + Vision Pipeline:**

1. **User uploads video** → Hook detects
2. **Extract frames** (ffmpeg) 
3. **Analyze with GPT-4o** (best vision quality)
4. **Generate summary**
5. **Save to Obsidian**

### Configuration

Add to `~/.openclaw/openclaw.json`:

```json
{
  "vision": {
    "enabled": true,
    "default_model": "openai/gpt-4o",
    "fallback_model": "kimi-coding/k2p5",
    "auto_extract_frames": true,
    "frame_interval_seconds": 5
  }
}
```

## Testing Vision

### Test with Current Model (Kimi K2.5)
Upload an image to this chat — I should be able to describe it.

### Test with GPT-4o
```bash
# Switch model
/model openai/gpt-4o

# Then upload image
```

## Current Status

- ✅ **Kimi K2.5** — Vision capable (active now)
- ✅ **GPT-4o** — Vision capable (configured)
- ⚠️  **Auto-routing** — Needs implementation

## Next Steps

### Option A: Test Current Vision
Upload an image right now and I'll analyze it with Kimi K2.5.

### Option B: Implement Auto-Router
Create hook/skill for automatic detection and routing.

### Option C: Manual Model Switch
Add `/model` command to easily switch between models.

Which do you want to try first?
