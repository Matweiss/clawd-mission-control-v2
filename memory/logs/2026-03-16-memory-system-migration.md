---
type: log
created: 2026-03-16 01:15 PT
tags: [system, memory, migration, critical]
status: active
---

# Memory System Migration

## What Happened
Migrated from static MEMORY.md to full CLAWD memory system with structured markdown files, YAML frontmatter, and GitHub integration.

## Changes Made
- Created `memory/` directory structure (context/, projects/, decisions/, logs/)
- Migrated all existing memory to new format with proper frontmatter
- Created BOOTSTRAP.md for new agent onboarding
- Created MEMORY-SOP.md with logging rules and workflows
- Created INDEX.md as manifest
- Set up context files: MAT.md, STACK.md, STATE.md
- Removed Anthropic API from config (now using OpenRouter for Claude)
- Configured new models: Kimi K2.5 (primary), OpenRouter suite, NVIDIA z.ai GLM 5

## Key Decisions
- **Memory format:** YAML frontmatter + markdown body
- **Storage:** Git-tracked files (not database)
- **Sync:** GitHub push triggers Vercel deploy → dashboard visibility
- **Timezone:** PT for all entries
- **Naming:** kebab-case slugs, YYYY-MM-DD dates

## Action Items
- [ ] Create update-memory-index.js script
- [ ] Add MemoryCard component to dashboard
- [ ] Add API route for memory files
- [ ] Test new agent bootstrap flow
- [ ] Document bootstrap prompt for sharing

## Context for Future Agents
This is the foundational migration. All future memory must follow MEMORY-SOP.md. When Mat says "log this", create a file in appropriate subdirectory, update INDEX.md, commit and push.

## Backup Created
- Location: `/root/.openclaw/workspace/backups/clawd-complete-20260316-0049.tar.gz`
- Size: 42MB
- Includes: workspace, openclaw.json, agents
- Bootstrap: `BACKUP_BOOTSTRAP_2026-03-16.md`
