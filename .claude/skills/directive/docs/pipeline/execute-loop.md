<!-- Pipeline doc: execute-loop.md | Split from 09-execute-projects.md -->

## Execute: Core Loop

### Multi-Project Execution

For multi-project plans: run execute once per project, sequentially by priority tier (P0 before P1). Each project is independent. Cross-project `depends_on` + file overlap determine parallel eligibility. For single-project plans: run execute once.

### Pre-execution Gate

```bash
echo '{"directive_dir":"'"$DIRECTIVE_DIR"'","directive_name":"'"$DIRECTIVE_NAME"'"}' | .claude/hooks/validate-project-json.sh
```

If `valid: false`, stop. Fix violations before proceeding.

### Wave Computation

Compute waves deterministically (no LLM) from project.json tasks + audit `active_files`.

**Global sequential files** (one task per wave if touched): `package.json`, `package-lock.json`, `tsconfig.json`, `prisma/schema.prisma`, `.env*`.

```
MAX_PARALLEL = 3
function computeWaves(tasks, auditResults):
    remaining = set(all task IDs), completed = set(), waves = []
    while remaining is not empty:
        eligible = [t for t in remaining if all t.depends_on in completed]
        if eligible is empty: ERROR("Circular dependency")
        tierEligible = eligible.filter(t => t.priority == eligible[0].priority)
        wave = [], occupiedFiles = set()
        for task in tierEligible:
            if len(wave) >= MAX_PARALLEL: break
            taskFiles = auditResults[task.id].active_files
            if taskFiles touches GLOBAL_SEQUENTIAL and len(wave) > 0: continue
            if taskFiles INTERSECT occupiedFiles is EMPTY:
                wave.append(task), occupiedFiles.addAll(taskFiles)
        waves.append(wave)
        for task in wave: remaining.remove(task.id), completed.add(task.id)
    return waves
```

Write to `wave-manifest.json`. Example: `{ "waves": [{ "wave": 1, "tasks": [{"id": "update-types"}], "parallel": false }] }`

### Wave Execution Loop

```
for each wave in wave manifest:
    if wave has 1 task:
        execute task sequentially (phases as normal)
    if wave has multiple tasks:
        spawn all build phases in parallel (each as CLI agent)
        wait for all builds to complete
        post-wave diff check

    // Reviews: SEQUENTIAL per task within the wave
    for each completed task in this wave:
        run code-review phase (if in task phases)
        run review phase
        run State Checkpoint (below)

    advance to next wave
```

Parallel builds use isolated agent processes (see [agent-prompts.md](agent-prompts.md) for spawn patterns). Reviews stay sequential because they read full files and fix cycles modify files — parallel reviews could see inconsistent state.

**Post-wave diff check:** Run `git diff --name-only`, compare against predicted `active_files`. Log drift: `[DRIFT] {task} modified {file} not in active_files`. Non-blocking.

Phase details: [phase-catalog.md](phase-catalog.md). Spawn patterns: [agent-prompts.md](agent-prompts.md).

---

## State Checkpoint -- After Each Task Review

The dashboard reads `directive.json` and `project.json` via WebSocket every second. Without these updates, the CEO sees "0% complete" despite work being done. This was the #1 failure mode in production -- agents completed work but never wrote progress.

**After each task's review completes:**

1. **Update project.json:**
   - Set `task.status` = `"completed"` (or `"partial"` / `"failed"`)
   - Set `task.dod[*].met` from the REVIEWER's `dod_verification` output (not builder self-assessment)
   - Set `project.updated` = current ISO timestamp
   - Write project.json

2. **Update directive.json:**
   - Set `pipeline.execute.output.progress` = `"X of Y tasks complete"`
   - Set `updated_at` = current ISO timestamp
   - Write directive.json

If you skip this, the CEO sees stale data and the stalled-directive detector may fire false positives.

## Code-Review Failure Handling

Code-review catches bugs before they reach DOD review. If findings are documented but the loop continues anyway, bugs get shipped.

If `code_review_outcome` = `"fail"` or `"critical"`:
1. Stop -- do not proceed to review
2. Re-spawn builder with findings (`bugs_found`, `data_flow_issues`)
3. Re-run code-review on the updated diff
4. Max 1 fix cycle -- if still failing, log and proceed to review

If `"pass"`: proceed normally.

## DOD Verification

Builders build; reviewers verify. The orchestrator updates project.json DOD from the reviewer's `dod_verification` output, not the builder's build report. If the reviewer omits `dod_verification`, write `null` -- the review-gate flags this.

Reviewer output: `{ "dod_verification": [{ "criterion": "...", "met": true, "evidence": "..." }] }`

---

## Conditional Retry (review_outcome = critical)

If any reviewer returns `"critical"`: re-spawn builder with findings, re-run only the critical reviewer(s). Max 1 retry -- if still critical, mark `partial` and continue.

"Critical" = guardrail violations, Standing Correction violations, data loss risk, fundamentally wrong approach. "Fail" = DOD gaps, missing edge cases, code quality issues.

## After Each Task

Log completion: `completed` / `partial` / `skipped` / `failed`.

**Stop-on-failure:** `failed`/`partial` tasks block their dependents. `skipped` does not block. Within a parallel wave, failures do not cascade. Across waves, only the failed task's dependency chain is blocked.

**Timeout:** 10 minutes per parallel task. Timeout = `failed`. Other wave tasks unaffected.

## Review-Gate: Review Verification (Hard Gate)

Reviews happen DURING execution, not after. Batching all builds and skipping reviews is the #1 failure mode.

**Post-execution hard gate:**

```bash
echo '{"directive_dir":"'"$DIRECTIVE_DIR"'"}' | .claude/hooks/validate-reviews.sh
```

The script iterates all projects under `$DIRECTIVE_DIR/projects/*/project.json`. If `valid: false`, stop. Run missing reviews first.

**Manual verification per completed/partial task:**
1. Was a reviewer agent spawned (not self-review)?
2. Did the reviewer produce structured output with `review_outcome`, `dod_verification`, `user_perspective`?
3. Did the reviewer's DOD verification mark each criterion?
4. For code-review phases: was a separate fresh-context review spawned?

If any check fails: log `[REVIEW MISSING] {task title}` and go back to run the missing review. Do not proceed to finalization.

If all pass: log `[REVIEWS VERIFIED] All {N} tasks have review artifacts` and proceed to wrapup.
