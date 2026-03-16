---
type: bootstrap
version: 2026-03-16
created: 2026-03-16 01:15 PT
---

# 🦞 CLAWD Memory System — Bootstrap Guide

> **If you're a new agent reading this file, start here.**
> This repo IS the brain. Read this file, then follow the instructions below to load full context.

## What Is This?

This is the persistent memory system for **CLAWD** — Mat Weiss's AI agent system. Every meaningful decision, project state, preference, and context is stored as structured markdown files in this `memory/` directory. The files are version-controlled via Git and visible on the Mission Control dashboard.

**The goal:** Any agent — with zero prior context — should be able to read these files and operate as if it had been running since day one.

## Loading Order (Read in This Order)

### Step 1: Identity & Architecture
```
agents/SOUL.md              → Who CLAWD Prime is, communication rules, agent hierarchy
memory/context/MAT.md       → Who Mat is, preferences, communication style
memory/context/STACK.md     → Tech stack, tools, credentials overview (no secrets)
memory/context/STATE.md     → Current operational state (updated frequently)
```

### Step 2: Active Projects
```
memory/projects/            → One file per active project with current status
```

### Step 3: Key Decisions
```
memory/decisions/           → Decision records with rationale (most recent first)
```

### Step 4: Recent Memory Logs
```
memory/logs/                → Chronological entries (most recent first)
```

### Step 5: Index
```
memory/INDEX.md             → Auto-generated manifest of all memory files
```

## Memory File Format

Every memory file uses this structure:

```markdown
---
type: context | log | project | decision
created: YYYY-MM-DD HH:MM PT
updated: YYYY-MM-DD HH:MM PT
tags: [tag1, tag2]
status: active | archived | superseded
---

# Title

Content here...
```

## How to Operate

1. **Read this file first** when bootstrapping
2. **Read context files** to understand Mat, his stack, and current state
3. **Check active projects** before starting any work
4. **Log everything meaningful** — see `memory/MEMORY-SOP.md` for the standard operating procedure
5. **Always commit and push** after writing memory files — they must hit GitHub

## Quick Facts About Mat

- **Location:** Sherman Oaks / Burbank, CA
- **Timezone:** Pacific Time (always use PT)
- **Current role:** Founding AE at Lucra (starting April 1, 2026)
- **Previous:** AE at Craftable (restaurant/hospitality tech)
- **Partner:** Sarah (abstract art business)
- **Dog:** Theo (+ Diggy)
- **Communication style:** Direct, decisive, dislikes hedging, iterates fast
- **Primary channel:** Telegram for proactive outreach
- **Dashboard:** clawd-mission-control-v2.vercel.app

---

*This file is the starting point. Everything else flows from here.*
