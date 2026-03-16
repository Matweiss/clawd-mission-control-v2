---
type: sop
created: 2026-03-16 04:50 PT
tags: [sop, automation, bedtime, home-assistant, telegram]
status: active
---

# Bedtime Automation SOP

## Trigger
When Mat says any of the following between 10:00 PM and 3:00 AM PT:
- "I'm going to bed"
- "Going to bed"
- "Time for bed"
- "Heading to bed"
- "Goodnight"
- Any variant containing "bed" + time indicator

## Action

### 1. Offer Inline Button in Telegram
Send a message with an inline keyboard button:

```
🌙 Goodnight! Ready to lock it down?

[ 🔒 Lock It Down ]
```

### 2. Button Action
When clicked, trigger Home Assistant automation:
- **Entity:** `automation.lock_it_down`
- **Action:** Locks all doors + turns off specified lights

### 3. What "Lock It Down" Does
- Locks all doors (front, den, living room, hallway, dog door)
- Turns off lights in:
  - Living room
  - Guest bathroom
  - Bedroom and master bathroom
- Leaves other lights as-is

## Context for Future Agents

**Time Window:** 10:00 PM - 3:00 AM PT only
- Outside this window, do not offer the button (might be nap, different context)
- If said during day, acknowledge but don't suggest lock-it-down

**Tone:** Brief, helpful, not intrusive
- Don't lecture about sleep
- One button, easy to dismiss
- If declined, don't ask again that night

**Dashboard Integration:**
- Home Assistant card shows "Lock It Down" button
- Available 24/7 from dashboard
- Telegram offer is the proactive version

**Related Entities:**
- `automation.lock_it_down` — Main HA automation
- `button.theo_s_food_feed` — Also shown in HA card
- Locks: `lock.front_door_2`, `lock.den_door`, `lock.living_room_3`, `lock.hallway_lock`, `lock.d017695baf16`

## Example Interactions

**Mat:** "Going to bed"
**Agent:** 🌙 Goodnight! Ready to lock it down? [🔒 Lock It Down]

**Mat:** "Goodnight clawd"
**Agent:** 🌙 Sleep well! Lock it down? [🔒 Lock It Down]

**Mat (9 PM):** "I'm tired, might head to bed soon"
**Agent:** (No button — before 10 PM threshold)

**Mat (11 PM):** "Bed time"
**Agent:** 🌙 Night! Lock it down? [🔒 Lock It Down]

## Implementation Notes
- Check `new Date().getHours()` >= 22 (10 PM) for time gate
- Use Telegram inline keyboard with callback data
- Call `/api/ha/command` with `action: 'lock_it_down'`
