# Rolling Schedule Cron Setup

## Overview
Configure OpenClaw cron jobs for automated CorePower + Regal schedule updates.

## Current operational note
The old `schedule-update ...` commands below are legacy placeholders. The live command path should be the unified Pixel runner:

```bash
python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py
```

## Cron Configuration

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "cron": {
    "jobs": [
      {
        "name": "monday-morning-schedule",
        "schedule": "0 6 * * 1",
        "command": "python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py",
        "description": "Pull rolling schedule via unified Pixel runner"
      },
      {
        "name": "wednesday-night-rollover",
        "schedule": "45 23 * * 3",
        "command": "python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py",
        "description": "Pull rolling schedule via unified Pixel runner"
      },
      {
        "name": "friday-night-rollover",
        "schedule": "45 23 * * 5",
        "command": "python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py",
        "description": "Pull rolling schedule via unified Pixel runner"
      },
      {
        "name": "sunday-weekend-update",
        "schedule": "45 23 * * 0",
        "command": "python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py",
        "description": "Pull rolling schedule via unified Pixel runner"
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

Before enabling cron, test the real runner manually:

```bash
python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py
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
1. Repoint registered cron jobs to the unified Pixel runner
2. Restart gateway only if config-based cron registration requires it
3. Test one cron-triggered run
4. Verify first automated run
