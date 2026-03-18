---
type: project
created: 2026-03-18 04:39 PT
updated: 2026-03-18 04:39 PT
tags: [automation, briefing, weekly, cron]
status: planned
priority: medium
---

# Weekly Briefing Automation

## Overview
Automated Monday morning briefing with key information for the week ahead.

## Schedule
**Every Monday, 7:00 AM PT** (before work week starts)

## Briefing Contents

### 1. Calendar Highlights
- Key meetings/events this week
- Upcoming deadlines (next 7 days)
- Travel dates (if applicable)

### 2. Weather
- Home (LA) forecast
- Travel destination weather (if traveling)

### 3. Action Items
- Open projects needing attention
- Overdue items
- New tasks from last week

### 4. Travel Countdown
- Days until next trip
- Pre-trip checklist items

### 5. Home Status
- Sarah's location/status
- Any alerts from HA
- Brief summary

### 6. Quick Stats
- Emails pending
- Yoga classes this week
- Pipeline value

## Delivery Method
**Telegram message** with clean formatting:

```
📅 Week of March 17-23

🗓️ Today: Dinner 6:15 PM
🗓️ Wed: Flight to PHX (11:15 AM)

✈️ Travel: 2 days until Arizona

🏠 Home: Sarah home, all systems normal

📊 Quick Stats:
• 3 unread emails
• 2 yoga classes scheduled
• $150K in pipeline

Have a great week!
```

## Technical Setup
- Cron job: `0 7 * * 1` (Mondays at 7am)
- Pull data from:
  - Google Calendar
  - Weather API
  - Memory/projects
  - Home Assistant
  - Email summary

## Next Steps
- [ ] Design briefing template
- [ ] Set up cron job
- [ ] Test data pulls
- [ ] Refine format based on feedback
