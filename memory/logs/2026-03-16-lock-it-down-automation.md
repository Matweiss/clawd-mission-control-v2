---
type: log
created: 2026-03-16 04:52 PT
tags: [home-assistant, automation, bedtime, sop, feature]
status: active
---

# Lock-It-Down Automation Added to Dashboard

## Changes Made

### 1. Home Assistant Card Updated
- Added "Lock It Down" button alongside "Feed Theo"
- 2-column grid layout for quick actions
- Indigo styling to distinguish from feed button
- Shows loading state while automation runs

### 2. API Support
- Command API already supported `lock_it_down` action
- Triggers `automation.lock_it_down` entity in Home Assistant

### 3. SOP Created
- **File:** `memory/sops/bedtime-automation.md`
- **Trigger:** "I'm going to bed" between 10 PM - 3 AM
- **Action:** Offer Telegram inline button to trigger automation
- **Effect:** Locks all doors + turns off living room, guest bath, bedroom, and master bath lights

## Entities Controlled
- `automation.lock_it_down` — Main automation
- Doors: front, den, living room, hallway, dog door
- Lights off: living room, guest bath, bedroom, master bath

## Usage

**Dashboard:** Click "Lock It Down" button any time

**Telegram (future):**
- Mat: "Going to bed" (after 10 PM)
- Agent: 🌙 Goodnight! Ready to lock it down? [🔒 Lock It Down]

## Context for Future Agents
This is a safety/security automation. Offer it proactively at bedtime but never pushy. The automation gives peace of mind (all doors locked, lights off) with one tap.
