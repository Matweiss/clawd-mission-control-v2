---
type: cron-schedule
created: 2026-03-18 16:40 UTC
updated: 2026-03-18 16:40 UTC
tags: [cron, corepower, regal, movies, yoga, automation]
---

# Rolling Schedule Updater — Cron Configuration

## Overview
Maintains a rolling 3-day schedule for CorePower Yoga "Main" filter and Regal Sherman Oaks Galleria movies.

## Current command path
The historical `schedule-update ...` placeholders in this doc are obsolete.

Use this single operational command for schedule automation:

```bash
python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py
```

That command now owns the live schedule run path and delegates to the existing preflight and pipeline logic.

## Schedule (Rolling 2-3 Day Window)

**Rule:** Every trigger = delete current → pull next. No history, no accumulation.

### Job 1: Monday Morning (Mon-Wed)
**When:** Every Monday at 6:00 AM PT  
**Command:** `python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py`  
**Action:**
- Delete existing schedule data
- Pull CorePower: Mon (after 6am) + Tue + Wed
- Pull Regal: Mon (after 6am) + Tue + Wed
- Save to: `memory/data/schedule-current.md`

### Job 2: Wednesday Late Night (Thu-Fri)
**When:** Every Wednesday at 11:45 PM PT  
**Command:** `python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py`  
**Action:**
- Delete Mon-Wed data
- Pull CorePower: Thu + Fri
- Pull Regal: Thu + Fri
- Save to: `memory/data/schedule-current.md`

### Job 3: Friday Late Night (Sat-Sun)
**When:** Every Friday at 11:45 PM PT  
**Command:** `python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py`  
**Action:**
- Delete Thu-Fri data
- Pull CorePower: Sat + Sun
- Pull Regal: Sat + Sun
- Save to: `memory/data/schedule-current.md`

### Job 4: Sunday Late Night (Next Week)
**When:** Every Sunday at 11:45 PM PT  
**Command:** `python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py`  
**Action:**
- Delete Sat-Sun data
- Pull CorePower: Next Mon + Tue + Wed
- Pull Regal: Next Mon + Tue + Wed
- Save to: `memory/data/schedule-current.md`

## Implementation

### Using Existing Processes
Each job executes the documented browser coworking workflows:

**CorePower "Main" Filter:**
1. Navigate to corepoweryoga.com
2. Click BOOK tab
3. Select "Main" from favorites dropdown
4. Extract schedule for target day(s)
5. Save to memory

**Regal Sherman Oaks:**
1. Navigate to regmovies.com/theatres
2. Select Sherman Oaks Galleria
3. Extract showtimes for target day(s)
4. Save to memory

## Output Format

### CorePower Schedule
```markdown
## CorePower Yoga — [Date Range]

### Monday, [Date]
| Time | Class | Studio | Teacher |
|------|-------|--------|---------|
| 4:30pm | YS | Sherman Oaks | Ling C |
| 5:30pm | YS | Encino | Gabriella D |

### Tuesday, [Date]
...
```

### Regal Movies
```markdown
## Regal Sherman Oaks Galleria — [Date Range]

### Monday, [Date]
| Movie | Times | Format |
|-------|-------|--------|
| Reminders of Him | 3:30pm, 6:30pm, 9:30pm | RPX |

### Tuesday, [Date]
...
```

## Manual Trigger
To run the live schedule path manually:
```bash
python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py
```

If cron jobs are already registered, they should all point to that same command.

## Files Managed
- `memory/data/schedule-mon-wed.md` (Mon 6am → Wed 11:45pm)
- `memory/data/schedule-thu-fri.md` (Wed 11:45pm → Mon 6am)
- `memory/data/schedule-weekend.md` (Sun 10am → Mon 6am)
- Archive: `memory/data/archive/schedule-YYYY-MM-DD.md`

## Next Steps
- [ ] Repoint registered cron jobs to `pixel-schedule-runner.py`
- [ ] Test one cron-triggered run end to end
- [ ] Verify data format with Mat
- [ ] Add Obsidian dashboard integration
