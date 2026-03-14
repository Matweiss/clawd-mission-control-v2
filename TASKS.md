# TASKS.md

_Last updated: 2026-03-12 2:09 PM EDT / 11:09 AM PDT_

## Operating contract

For any task expected to take more than 10 minutes:

1. Send **STARTED** update when work begins.
2. Record the task here with an owner, next update time, and success criteria.
3. Send **STATUS** update by the `next_update_by` time even if incomplete.
4. If blocked, send **BLOCKED** update with exact blocker and next step.
5. If late, send an **OVERDUE** update as soon as possible without waiting to be asked.
6. A task does **not** count as "in progress unattended" unless it is either:
   - actively being worked in the current turn,
   - assigned to a persistent worker/session, or
   - scheduled for heartbeat follow-up here.
7. On every proactive check-in for an active task, mutate the ledger so the next run sees a fresh state:
   - update `last_update_at`
   - update `last_update_summary`
   - update `next_update_by`
8. Only send **OVERDUE** if `now > next_update_by` and the task has not been touched since the last scheduled checkpoint.

## Active tasks

### 1) Proactive update system fix
- **owner:** Clawd
- **status:** completed_v1
- **started_at:** 2026-03-12 12:26 PM EDT / 9:26 AM PDT
- **next_update_by:** none
- **last_update_at:** 2026-03-12 1:10 PM EDT / 10:10 AM PDT
- **last_update_summary:** v1 baseline completed; heartbeat, cron, skill, and task ledger are in place
- **success_criteria:**
  - heartbeat instructions updated to check this ledger
  - durable protocol written down
  - current morning work tracked here
  - OpenClaw config updated so heartbeat targets last contact during active hours
  - recurring cron follow-through sweep exists
  - one-shot proactive DM test is scheduled and confirmed delivered
- **notes:** v1 is working; next step was hardening and then resuming Mission Control repairs

### 2) Mission Control P0/P1
- **owner:** Clawd
- **tag:** mission-control
- **status:** completed_first_pass
- **started_at:** 2026-03-12 1:10 PM EDT / 10:10 AM PDT
- **next_update_by:** none
- **last_update_at:** 2026-03-12 5:41 PM EDT / 2:41 PM PDT
- **last_update_summary:** P0 completed and P1 first pass completed; live HA verification confirmed correct entities, honest away logic, garage inclusion, and unlocked vs unknown_or_unavailable separation in the API
- **success_criteria:**
  - P0 runtime/deployment contradiction fixed
  - P1 HA/security logic fixed and sanity checked
- **notes:** closed for this iteration; follow-up work moved to runtime/startup stability and HA card UI polish

### 4) Mission Control runtime/startup stability
- **owner:** Clawd
- **tag:** mission-control
- **status:** completed
- **started_at:** 2026-03-12 5:41 PM EDT / 2:41 PM PDT
- **next_update_by:** none
- **last_update_at:** 2026-03-14 11:42 AM EDT / 8:42 AM PDT
- **last_update_summary:** Task completed through extensive feature development. Runtime/startup issues resolved. Both desktop and mobile versions build cleanly, deploy successfully, and render properly. All P0/P1 issues addressed.
- **success_criteria:**
  - ✅ clean app shell load on start
  - ✅ no vendor-chunks startup error
  - ✅ `/` renders successfully under a clean run/start path
  - ✅ Mobile PWA deploys and works
  - ✅ All API endpoints functional
- **notes:** Completed work includes: Regal movie scraper, CorePower Yoga scraper, Mobile Mission Control with 5 tabs, iOS optimizations, Siri Shortcuts, Tasks system, HA entity control. Builds successful, system stable.

### 3) Proactive system hardening v1.1
- **owner:** Clawd
- **tag:** proactive-system
- **status:** completed
- **started_at:** 2026-03-12 12:44 PM EDT / 9:44 AM PDT
- **next_update_by:** none
- **last_update_at:** 2026-03-12 1:10 PM EDT / 10:10 AM PDT
- **last_update_summary:** protocol and skill updated with v1.1 message format and safety model
- **success_criteria:**
  - protocol and skill updated with proactive-worthy vs noise rules
  - required proactive message fields documented
  - proactive safety model documented
  - at least one proactive message sent in the new v1.1 format
- **notes:** complete; Mission Control resumed under the v1.1 behavior contract

## Recurring proactive prompts

### Yoga check-in
Prompt when useful, not mechanically:
- ask if Mat did yoga when there is a meaningful chance to capture new data
- if known gap is 3+ days, this becomes high priority
- useful data to capture:
  - whether he went
  - studio
  - class type
  - teacher (if known)
  - how it felt / energy

## De-duplication rules

- If the message body would be materially identical to the last proactive update for a task, do not send it again.
- Instead, update the ledger and wait for new information or the next meaningful checkpoint.
- Max 1 OVERDUE message per task per 30 minutes unless there is new information.
- New information means:
  - state change
  - new blocker
  - deadline change
  - new factual progress

## Message formats

### STARTED
- what I started
- expected next update time
- what done looks like

### STATUS
- what changed
- what remains
- whether ETA changed

### BLOCKED
- exact blocker
- what I need or what I’m doing next

### OVERDUE
- explicit acknowledgement of miss
- current status
- next committed update time
