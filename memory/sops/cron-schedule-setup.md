# Rolling Schedule Cron Setup

## Overview
Configure OpenClaw cron jobs for automated CorePower + Regal schedule updates.

## Cron Configuration

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "cron": {
    "jobs": [
      {
        "name": "monday-morning-schedule",
        "schedule": "0 6 * * 1",
        "command": "schedule-update monday",
        "description": "Pull Mon-Wed CorePower + Regal schedules"
      },
      {
        "name": "wednesday-night-rollover", 
        "schedule": "45 23 * * 3",
        "command": "schedule-update thursday-friday",
        "description": "Delete Mon-Wed, pull Thu-Fri schedules"
      },
      {
        "name": "sunday-weekend-update",
        "schedule": "0 10 * * 0",
        "command": "schedule-update weekend",
        "description": "Pull Sat-Sun CorePower + Regal schedules"
      }
    ]
  }
}
```

## Schedule Breakdown

| Cron Expression | When | Action |
|----------------|------|--------|
| `0 6 * * 1` | Monday 6:00 AM PT | Pull Mon (after 6am) + Tue + Wed |
| `45 23 * * 3` | Wednesday 11:45 PM PT | Clear Mon-Wed, pull Thu + Fri |
| `0 10 * * 0` | Sunday 10:00 AM PT | Pull Sat + Sun |

## Manual Testing

Before enabling cron, test each schedule manually:

```bash
# Test Monday schedule (Mon-Wed)
openclaw schedule-update monday

# Test Wednesday rollover (Thu-Fri)  
openclaw schedule-update thursday-friday

# Test Sunday weekend (Sat-Sun)
openclaw schedule-update weekend
```

## Implementation

### Process: Monday Morning
1. SSH tunnel to Mac (browser coworking)
2. Navigate CorePower → BOOK → Main filter
3. Extract Mon/Tue/Wed classes
4. Navigate Regal → Sherman Oaks Galleria
5. Extract Mon/Tue/Wed showtimes
6. Save to `memory/data/schedule-current.md`
7. Push to GitHub
8. Notify Mat via Telegram

### Process: Wednesday Night
1. Archive current schedule
2. Clear Mon-Wed data
3. Pull Thu-Fri CorePower + Regal
4. Save to `memory/data/schedule-current.md`
5. Push to GitHub

### Process: Sunday Morning
1. Pull Sat-Sun CorePower + Regal
2. Append to current schedule
3. Push to GitHub

## Output Location
All schedules saved to:
- `memory/data/schedule-current.md` (active schedule)
- `memory/data/archive/schedule-YYYY-MM-DD.md` (archived)

## Notification
After each update:
- Telegram DM to Mat with summary
- "Schedule updated: [Mon-Wed] 12 classes, 8 movies"

## Next Steps
1. Restart gateway to load cron config
2. Test manual commands
3. Enable cron jobs
4. Verify first automated run
