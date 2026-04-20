# Schedule Scraper Automation Workflow

## Overview
Automated browser-based scraping of CorePower Yoga and Regal movie schedules.

## Current operational entrypoint
The old manual step list below is historical context. The live entrypoint is:

```bash
python3 /root/.openclaw/workspace/shared/pixel-agent/scripts/pixel-schedule-runner.py
```

That runner:
- calls the CorePower pipeline
- preserves degraded-state signaling into `data/schedule-current.json`
- relies on preflight alerting to open Paperclip alerts when prerequisites are down
- refreshes warm browser state after successful runs
- writes run state to `shared/pixel-agent/memory/schedule-runner-state.json`

## Trigger
Called by cron jobs:
- `monday-schedule` (Mon 6am)
- `wednesday-schedule` (Wed 11:45pm)
- `friday-schedule` (Fri 11:45pm)
- `sunday-schedule` (Sun 11:45pm)

## Prerequisites
Uses **browser coworking** (Mac Chrome with remote debugging):

1. **On Mac:** Chrome running with remote debugging:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=18800
   ```

2. **On Mac:** SSH tunnel active:
   ```bash
   ssh -N -R 18800:127.0.0.1:18800 root@srv882799.hstgr.cloud
   ```

3. **On VPS:** Chrome DevTools MCP configured:
   ```bash
   mcporter list  # Should show chrome-devtools
   ```

## Workflow: Monday Schedule (Mon-Wed)

**Uses live browser coworking** — you can see everything I do in your Chrome window.

### Step 1: Delete Old Schedule
```bash
rm -f ~/.openclaw/workspace/clawd-mission-control-v2/memory/data/schedule-current.md
```

### Step 2: Scrape CorePower Yoga "Main" Filter
```bash
# Navigate to CorePower
mcporter call chrome-devtools.navigate_page url="https://www.corepoweryoga.com/"

# Click BOOK tab (find uid from snapshot)
mcporter call chrome-devtools.click uid="15_19"

# Click favorites dropdown
mcporter call chrome-devtools.click uid="16_37"

# Select "Main"
mcporter call chrome-devtools.click uid="18_1"

# Wait for schedule to load
sleep 2

# Extract schedule data
mcporter call chrome-devtools.take_snapshot
```

Parse the snapshot for:
- Day/date headers
- Class times
- Class types (YS, C1, C2, etc.)
- Studio locations (Encino, Sherman Oaks)
- Teacher names

### Step 3: Scrape Regal Sherman Oaks
```bash
# Navigate to Regal theaters
mcporter call chrome-devtools.navigate_page url="https://www.regmovies.com/theatres"

# Search and click Sherman Oaks Galleria
mcporter call chrome-devtools.click uid="22_141"

# Wait for showtimes
sleep 2

# Extract showtime data
mcporter call chrome-devtools.take_snapshot
```

Parse the snapshot for:
- Movie titles
- Showtimes
- Formats (Standard, RPX, IMAX)

### Step 4: Save Schedule
Create `memory/data/schedule-current.md`:
```markdown
---
generated: {{date}}
coverage: Monday {{date}} - Wednesday {{date}}
---

# Schedule: Mon-Wed

## CorePower Yoga

### Monday, {{date}}
| Time | Class | Studio | Teacher |
|------|-------|--------|---------|
| ... | ... | ... | ... |

### Tuesday, {{date}}
...

### Wednesday, {{date}}
...

## Regal Sherman Oaks Galleria

### Monday, {{date}}
| Movie | Showtimes |
|-------|-----------|
| ... | ... |

### Tuesday, {{date}}
...

### Wednesday, {{date}}
...
```

### Step 5: Commit and Push
```bash
cd ~/.openclaw/workspace/clawd-mission-control-v2
git add memory/data/schedule-current.md
git commit -m "Update schedule: Mon-Wed {{date}}"
git push origin main
```

### Step 6: Notify Mat
Send Telegram message:
"📅 Schedule updated: Mon-Wed\n\nCorePower: {{class_count}} classes\nRegal: {{movie_count}} movies\n\nView in Obsidian: schedule-current.md"

## Parsing Logic

### CorePower Snapshot Parsing
Look for:
- `heading` elements with day names
- `button` elements with times (e.g., "4:30pm")
- `StaticText` with class names ("YS - Yoga Sculpt", "C2 - CorePower Yoga 2")
- Text containing "Encino" or "Sherman Oaks"

### Regal Snapshot Parsing
Look for:
- `heading` level 4 with movie titles
- `button` elements with showtimes
- Text containing "RPX", "IMAX", "Standard"

## Error Handling

### If SSH tunnel is down:
1. Log error to `memory/logs/schedule-errors.md`
2. Send Telegram: "⚠️ Schedule update failed: SSH tunnel down"
3. Retry on next cron trigger

### If Chrome is not responding:
1. Log error
2. Send Telegram: "⚠️ Schedule update failed: Chrome not accessible"

### If page structure changed:
1. Log error with snapshot
2. Send Telegram: "⚠️ Schedule update failed: Page structure changed, manual intervention needed"

## Testing

### Manual Test Command
```bash
openclaw cron run d45a2c7d-cd11-4ca8-bcfd-1e1ed64c3629
```

### Verify Output
Check:
1. `memory/data/schedule-current.md` exists
2. File contains both CorePower and Regal data
3. GitHub shows the commit
4. Obsidian syncs the file

## Future Improvements
- [ ] Add screenshot capture for visual verification
- [ ] Add movie poster images
- [ ] Add class booking links
- [ ] Add "book this class" button in Obsidian
