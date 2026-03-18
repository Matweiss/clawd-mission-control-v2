---
type: project
created: 2026-03-18 04:39 PT
updated: 2026-03-18 04:39 PT
tags: [github, dashboard, projects, automation]
status: planned
priority: low
---

# GitHub Project Dashboard

## Overview
Unified view of all Mat's GitHub projects, issues, and PRs across repositories.

## Repositories to Track
- `Matweiss/clawd-mission-control-v2` — Main dashboard
- `Matweiss/clawd-brain-data` — Memory/data store
- `Matweiss/clawd-command-center` — Command center
- *(Any other private repos)*

## Dashboard Features

### Overview Cards
| Repo | Open Issues | Open PRs | Last Activity |
|------|-------------|----------|---------------|
| mission-control-v2 | 5 | 2 | 2 days ago |
| brain-data | 1 | 0 | 1 week ago |

### Priority Issues
- Issues labeled `priority`, `bug`, `urgent`
- Assigned to Mat
- Sorted by age

### PRs Needing Review
- Open PRs
- Draft PRs
- Stale PRs (>30 days)

### Activity Feed
- Recent commits
- Releases
- Milestone progress

## Integration Ideas

### With Mission Control
- GitHub card on dashboard
- Issue count in Quick Stats
- Alert on urgent issues

### Telegram Notifications
- New issues assigned to you
- PR review requests
- Build failures

### Voice Commands
- "Show my GitHub issues"
- "Any PRs needing review?"
- "What's the status of mission-control?"

## Technical Approach
- GitHub API (REST or GraphQL)
- Personal access token required
- Cache data to avoid rate limits

## Next Steps
- [ ] Generate GitHub PAT with repo access
- [ ] Design dashboard card layout
- [ ] Build API integration
- [ ] Test with live data
