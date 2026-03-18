---
type: project
created: 2026-03-18 04:39 PT
updated: 2026-03-18 04:39 PT
tags: [voice, browser, coworking, accessibility]
status: planned
priority: low
---

# Voice-Controlled Browser Coworking

## Overview
Hands-free browser automation via voice commands — coworking without typing.

## Use Cases

### CorePower Yoga
- "Book the 7pm Yoga Sculpt class at Encino"
- "Show me tomorrow's schedule"
- "Book that class" (after viewing)

### Regal Movies
- "What movies are playing at Sherman Oaks tonight?"
- "Show me showtimes for Scream 7"
- "Buy tickets for the 7:30 show"

### General Browsing
- "Navigate to example.com"
- "Search for [query]"
- "Click the submit button"
- "Scroll down"
- "Go back"

## Technical Approach

### Voice Input Options
1. **Telegram voice messages** → Transcribe → Execute
2. **Browser mic** (if supported)
3. **Phone/Siri shortcut** → Send to OpenClaw

### Command Parsing
- Natural language → Structured command
- Context awareness (current page)
- Confirmation for purchases/bookings

### Execution Flow
```
Voice → Transcribe → Parse Intent → Browser Action → Confirm
   ↓          ↓            ↓              ↓            ↓
"Book it"  "book"    book_class    navigate→click   "Done!"
```

## Safety Measures
- Confirm before purchases
- Preview before submitting forms
- "Cancel" at any time
- Visual feedback in browser

## Integration
- Works with existing browser coworking setup
- Adds voice layer on top of Chrome DevTools MCP
- Fallback to text if voice unclear

## Next Steps
- [ ] Choose voice input method
- [ ] Design command vocabulary
- [ ] Build parser/translator
- [ ] Test with CorePower booking flow
- [ ] Test with Regal ticket purchase

## Future Ideas
- Multi-step workflows ("Book yoga, then check movies")
- "What did we just look at?" (context memory)
- Voice bookmarks ("Save this for later")
