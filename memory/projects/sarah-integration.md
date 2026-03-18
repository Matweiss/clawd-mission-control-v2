---
type: project
created: 2026-03-18 04:44 PT
updated: 2026-03-18 04:44 PT
tags: [family, sarah, shared-calendar, todo, notifications, telegram]
status: planned
priority: high
---

# Sarah Integration — Shared Calendar & To-Do

## Overview
Enable Sarah to communicate with Clawd, add items to shared calendar/to-do list, and notify Mat of all requests.

## Goals
1. **Sarah Access** — Sarah can message Clawd directly
2. **Shared Calendar** — Sarah can add events, Mat gets notified
3. **Shared To-Do** — Sarah can add tasks, Mat gets notified
4. **Transparency** — Mat sees everything Sarah requests

## Implementation Options

### Option A: Telegram Group Chat
- Add Clawd bot to a group chat with Mat + Sarah
- Sarah messages in group, Clawd responds
- Mat sees all interactions naturally
- **Pros:** Simple, transparent, already working
- **Cons:** Both see everything (may be feature, not bug)

### Option B: Sarah's Own Telegram Chat
- Sarah messages Clawd bot directly
- Clawd forwards/paraphrases to Mat
- **Pros:** Private between Sarah and Clawd
- **Cons:** Requires notification system to Mat

### Option C: Shared WhatsApp Group
- Similar to Option A but on WhatsApp
- **Pros:** If Sarah prefers WhatsApp
- **Cons:** Need to set up WhatsApp channel

## Recommended: Option A (Telegram Group)

### Setup Steps
1. Create Telegram group: "Mat & Sarah + Clawd"
2. Add @clawd_mission_control_bot to group
3. Configure bot to respond to both of you
4. Set up shared calendar/to-do integration

### Calendar Integration
- **Google Calendar:** Shared "Family Calendar"
- Sarah: "Add dinner with parents on Friday 7pm"
- Clawd: Adds to calendar + notifies Mat

### To-Do Integration
Options:
- **Google Tasks** (simple, integrated with Calendar)
- **Notion** (more structured, shareable)
- **Todoist** (robust API, good for couples)
- **Simple Markdown** in shared GitHub repo

## Notification Flow

### Sarah → Clawd → Action → Mat Notification
```
Sarah: "Remind us to book flights to NYC"
Clawd: [Adds to todo list]
Clawd → Mat: "Sarah added: Book flights to NYC"
```

### Example Commands Sarah Can Use
- "Add [event] to calendar on [date] at [time]"
- "Remind us to [task] by [date]"
- "What's on our schedule this week?"
- "Add milk to shopping list"
- "Did Mat already feed Theo?"

## Privacy & Boundaries

### What Sarah Can See/Do
- ✅ Add calendar events
- ✅ Add to-do items
- ✅ Check schedules
- ✅ Home Assistant status (Theo fed?, Sarah location, etc.)
- ✅ Ask general questions

### What Stays Private to Mat
- ❌ Mat's work messages
- ❌ Mat's private calendar (unless shared)
- ❌ Sensitive project discussions

## Technical Requirements

### For Google Calendar Integration
- Shared calendar (mat@craftable.com grants access to sarah@...)
- OAuth scope: `https://www.googleapis.com/auth/calendar`
- Permission to create events on behalf of either

### For To-Do Integration
Depends on choice:
- **Google Tasks:** Same OAuth as Calendar
- **Notion:** Integration token
- **GitHub Markdown:** Repo access

### For Notifications
- Telegram group = automatic visibility
- Or separate notification to Mat's DM

## Implementation Details

### Sarah's Telegram
- **Username:** @Sarahjschwartz
- **ID:** 8638454950
- **Access:** Direct message to @clawd_mission_control_bot

### GitHub To-Do Location
- **Repo:** `Matweiss/clawd-brain-data`
- **File:** `shared-calendar-todo.md`
- **Format:** Markdown with tables for scheduled items

### Notification Flow
```
Sarah messages Clawd → Clawd adds to GitHub → Commit → 
→ Telegram DM to Mat → Log to Mission Control (attributed to Sarah)
```

### Mission Control Logging
All Sarah-initiated actions logged to:
- `memory/logs/sarah-actions-YYYY-MM-DD.md`
- Tagged: `[sarah, shared-calendar, family]`

## Example Interactions

**Sarah:** "Remind us to book NYC flights by Friday"
**Clawd:** ✅ Added to shared to-do
**→ Mat DM:** "Sarah added: Book NYC flights by Friday"
**→ Mission Control:** Logged with timestamp and attribution

**Sarah:** "Add dinner with parents on Saturday 7pm"
**Clawd:** ✅ Added to calendar
**→ Mat DM:** "Sarah scheduled: Dinner with parents — Sat 7pm"
**→ Mission Control:** Logged with full details

## Next Steps
- [x] Confirm approach (Telegram separate chats)
- [x] Set up GitHub shared to-do
- [x] Configure Clawd to recognize Sarah's Telegram ID
- [ ] Test first shared item
- [ ] Sarah onboards (send her bot link)
- [ ] Train Sarah on commands

## Notes
- Sarah's Telegram ID needed for direct recognition
- Can set different permission levels
- All actions logged for transparency
