# Safety Invariant Test Pack

Mission Control production changes should pass these non-negotiable checks before deploy approval.

## Run it

```bash
npm run check:safety       # changed files only
npm run check:safety:all   # whole tracked repo
```

For deploy gates that require explicit rollback readiness:

```bash
REQUIRE_ROLLBACK_NOTES=1 npm run check:safety -- --rollback-notes docs/rollback-readiness.md
```

## Invariants encoded

1. **No mock data in live dashboards/APIs**
   - Scans live `src/**` code for obvious mock/fake/dummy data markers.
   - Test fixtures/stories are ignored.

2. **Auth boundary required for mutating/sensitive API routes**
   - Mutating API routes and sensitive route names must show an obvious token, secret, auth, or environment-gated boundary.

3. **No unbounded retries or infinite loops**
   - Blocks `while (true)` and `for (;;)` in source code.
   - Warns when retry-related code lacks a visible max attempts, timeout, abort signal, or cap.

4. **Rollback readiness before risky deploys**
   - Optional strict mode requires rollback notes with a rollback target/mechanism and an owner or decision trigger.

## Output contract

The checker exits non-zero on errors. Use `--json` for CI/Paperclip ingestion.
