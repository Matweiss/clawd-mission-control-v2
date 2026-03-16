---
type: context
created: 2026-03-16 01:15 PT
updated: 2026-03-16 01:15 PT
tags: [sop, memory, system, critical]
status: active
---

# 🧠 Memory Logging — Standard Operating Procedure

> **This is a system instruction.** Follow this SOP every time Mat says "log this to memory", "remember this", "save this", or any variant.

## Core Rule

**Every memory entry is a `.md` file committed to Git and pushed to GitHub.** Memory is not ephemeral. Memory is not a database row. Memory is a portable, readable, version-controlled markdown file that any future agent can read to reconstruct full context.

## When to Log Memory

Log a memory entry when:
- Mat explicitly says "log this", "remember this", "save this to memory"
- A **key decision** is made (hiring, pricing, strategy, tool choice)
- A **project milestone** is reached (shipped, signed, launched, killed)
- **New context** is learned that would matter to a future agent (preferences, relationships, constraints)
- A **significant conversation** happens that changes strategy or direction
- Mat overrides your recommendation — log the override AND his reasoning

**Do NOT log:**
- Routine questions/answers that don't change operational state
- Temporary debugging sessions
- Small talk

## File Types & Where They Go

### 1. Memory Logs (`memory/logs/YYYY-MM-DD-slug.md`)
Chronological entries. One file per distinct event or session.

```markdown
---
type: log
created: 2026-03-15 14:30 PT
tags: [lucra, pipeline, strategy]
status: active
---

# Lucra Pipeline Strategy Session

## What Happened
Mat decided to focus outreach on Priority A entertainment venues first...

## Key Decisions
- Start with Five Iron Golf as anchor account
- Position Lucra as revenue tool, not "gamification"

## Action Items
- [ ] Draft Five Iron outreach email
- [ ] Build battle card for TopGolf competitor comparison

## Context for Future Agents
This changes the outreach sequence — prioritize venues with existing Craftable relationships.
```

### 2. Project Files (`memory/projects/project-name.md`)
Living documents — updated as projects evolve. One file per project.

```markdown
---
type: project
created: 2026-03-15 12:00 PT
updated: 2026-03-15 14:00 PT
tags: [mission-control, dashboard, active]
status: active
---

# Mission Control Dashboard

## Overview
Next.js dashboard for monitoring AI agents, email, pipeline, and home automation.

## Current State
- Deployed to Vercel
- HA integration working
- Supabase data needs sync service restart

## Tech
- Next.js 14 + React 18 + TypeScript + Tailwind
- Supabase for realtime
- Vercel for hosting

## History
- Feb 2026: Initial build with cyberpunk theme
- Mar 2026: Added CorePower yoga, Gemini chat, HA controls, mobile PWA
- Mar 15 2026: UI/UX overhaul, memory system added

## Open Issues
- Sync service needs restart
- .env.local needs purging from git history
```

### 3. Decision Records (`memory/decisions/YYYY-MM-DD-slug.md`)
When a meaningful choice is made with alternatives considered.

```markdown
---
type: decision
created: 2026-03-15 10:00 PT
tags: [lucra, compensation, negotiation]
status: active
---

# Decision: Lucra Offer Terms

## Decision
Accepted Lucra Founding AE offer with negotiated terms.

## Key Terms
- 0.175% equity (61,141 shares)
- April 1 start date
- Q1 2027 quota review clause
- Mutual written consent for mid-year commission changes

## Alternatives Considered
- Counter for higher equity → decided current terms were fair for founding role
- Earlier start date → April 1 gives time to wind down Craftable properly

## Rationale
Path to Director of Sales in 6-9 months is the real upside. Equity is bonus.
```

### 4. Context Updates (`memory/context/*.md`)
Update existing context files when persistent facts change (new role, new tool, new preference). Don't create new context files often — update the existing ones.

## File Naming Rules

| Type | Pattern | Example |
|------|---------|---------|
| Log | `memory/logs/YYYY-MM-DD-slug.md` | `memory/logs/2026-03-15-lucra-pipeline-strategy.md` |
| Project | `memory/projects/project-name.md` | `memory/projects/mission-control.md` |
| Decision | `memory/decisions/YYYY-MM-DD-slug.md` | `memory/decisions/2026-03-15-lucra-offer-terms.md` |
| Context | `memory/context/TOPIC.md` | `memory/context/MAT.md` |

- Slugs are lowercase, hyphenated, descriptive
- Dates are always YYYY-MM-DD
- No spaces in filenames

## After Writing a Memory File

**Always run these commands:**

```bash
cd /root/.openclaw/workspace/clawd-mission-control-v2

# Stage the new/updated memory file
git add memory/

# Update the index
node scripts/update-memory-index.js  # (or manually update INDEX.md)

# Commit with a descriptive message
git commit -m "memory: [type] short description"

# Push to GitHub (triggers Vercel deploy, makes it visible on dashboard)
git push origin main
```

### Commit message format:
- `memory: log — Lucra pipeline strategy session`
- `memory: decision — accepted Lucra offer terms`
- `memory: project — updated mission-control status`
- `memory: context — updated Mat's role to Lucra AE`

## Updating INDEX.md

After adding any memory file, update `memory/INDEX.md` to include the new entry. The INDEX is the table of contents — it lets agents and the dashboard quickly scan what's available without reading every file.

## Bootstrap Protocol (For New Agents)

When a new agent needs full context, give it this instruction:

```
Read the following files in order from the GitHub repo
github.com/Matweiss/clawd-mission-control-v2:

1. memory/BOOTSTRAP.md (start here)
2. memory/context/MAT.md
3. memory/context/STACK.md  
4. memory/context/STATE.md
5. memory/INDEX.md (scan for relevant project/decision files)
6. memory/projects/ (read active projects)
7. memory/logs/ (read last 5-10 entries for recent context)

After reading, you should know:
- Who Mat is and how he communicates
- What tools and systems are in use
- What the current operational state is
- What projects are active
- What recent decisions were made

You are now bootstrapped. Operate as CLAWD.
```

## Dashboard Visibility

Memory files are displayed in the Mission Control dashboard under the "Memory" section. The dashboard reads from GitHub via API, so pushing to `main` makes entries immediately visible.

## Rules

1. **Memory is sacred** — when in doubt, log it
2. **One file per topic** — don't append unrelated things to existing files
3. **Always push to GitHub** — if it's not pushed, it doesn't exist
4. **Keep entries scannable** — headers, bullets, short paragraphs
5. **Include "Context for Future Agents" section** in logs when the entry changes how things work
6. **Never store secrets** — no API keys, tokens, passwords in memory files
7. **Update STATE.md** when operational reality changes
8. **Date everything** — use PT timezone, always
