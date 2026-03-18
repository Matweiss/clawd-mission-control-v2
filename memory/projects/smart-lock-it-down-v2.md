---
type: project
created: 2026-03-18 04:39 PT
updated: 2026-03-18 04:39 PT
tags: [smart-home, security, automation, telegram]
status: planned
priority: medium
---

# Smart "Lock It Down" v2

## Overview
Enhanced bedtime/home security automation with context awareness.

## Current v1 (Active)
- Trigger: Telegram message "going to bed" (10 PM - 3 AM)
- Action: Offer inline button to trigger `automation.lock_it_down`
- Result: Locks doors, turns off lights

## v2 Enhancements

### Context-Aware Locking
- [ ] Check if Sarah is home before locking
  - If home: Confirm both are ready
  - If away: Standard lock
- [ ] Camera snapshot to Telegram
  - "Locking down — here's the house status"
- [ ] Verify doors actually locked
  - Retry if failed
  - Alert if can't confirm

### Travel Mode Integration
- [ ] "Away for the night" vs "away for days"
- [ ] Extra security when both traveling
- [ ] Automated "all clear" checks every 2 hours

### Proactive Mode
- [ ] Auto-offer at 10:30 PM if not manually triggered
- [ ] Weekend mode (later trigger time)
- [ ] Post-dinner mode (if dinner out, auto-offer earlier)

## Smart Conditions
| Scenario | Action |
|----------|--------|
| Both home, bedtime | Standard lock + camera snap |
| Sarah away, Mat home | Confirm solo lock |
| Both away (travel) | Enhanced monitoring mode |
| Late night (post-midnight) | Silent lock, no Telegram |

## Technical Requirements
- Home Assistant entity: `device_tracker.sarah_s_iphone2`
- Camera integration (pending camera project)
- Lock status sensors
- Telegram inline keyboard

## Next Steps
- [ ] Add Sarah presence check
- [ ] Integrate camera snapshots
- [ ] Add lock verification retry
- [ ] Test travel mode logic
