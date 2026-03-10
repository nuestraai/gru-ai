---
name: "smoke-test"
description: "Pipeline end-to-end smoke test -- creates a trivial directive, runs it through /directive, validates every pipeline step, and reports pass/fail with evidence. Use after pipeline doc changes to verify nothing is broken. Completes in ~10 minutes."
---

# Smoke Test -- Pipeline E2E Verification

Run a real directive through the full pipeline and verify every step produces correct output.

**Arguments:** `$ARGUMENTS` (passed as `$1` to the script)
- Empty or `medium` -- run a medium-weight smoke test (brainstorm skipped, clarification/approve auto-approved)
- `lightweight` -- run a lightweight smoke test (brainstorm skipped, clarification/approve auto-approved)

## What This Does

1. Creates a disposable test directive (`smoke-test-{timestamp}`) with a trivial task
2. Spawns a real `/directive` session that executes the full pipeline
3. Polls `directive.json` every 10 seconds to track step progression
4. Validates each completed step via `validate-gate.sh`
5. Enforces a 10-minute overall timeout
6. Prints a pass/fail table per pipeline step with evidence
7. Cleans up the test branch and directive artifacts on exit

## Step 1: Run the Smoke Test

Execute the bash runner script. It handles everything -- directive creation, agent spawning, polling, validation, reporting, and cleanup.

```bash
bash .claude/skills/smoke-test/run-smoke-test.sh $ARGUMENTS
```

The script will output real-time progress as each step completes and a final summary table.

## Step 2: Present Results

After the script finishes, present the results to the CEO in this format:

```
# Smoke Test Results

## Summary
- Weight: {lightweight | medium}
- Duration: {X}m {Y}s
- Result: {PASS | FAIL}

## Step Results

| # | Step              | Status    | Gate     | Evidence                         |
|---|-------------------|-----------|----------|----------------------------------|
| 1 | triage            | completed | PASS     | weight=medium, directive.json ok |
| 2 | checkpoint        | completed | PASS     | No prior checkpoint              |
| ...                                                                            |
|15 | completion        | completed | PASS     | test_mode auto-approved          |

## Failures (if any)
- Step {name}: {what went wrong, gate violations, missing artifacts}

## Cleanup
- Test branch: deleted
- Test directive: deleted
```

## Step 3: Interpret Results

- **All PASS**: Pipeline is healthy. Safe to ship pipeline doc changes.
- **Step failed**: The step that failed and its gate violations tell you exactly what broke. Check the pipeline doc for that step.
- **Timeout**: The pipeline stalled. Check which step was `active` when time ran out -- that step's doc likely has a bug or missing instruction.

## Failure Handling

| Situation | Action |
|-----------|--------|
| Script exits non-zero | Report the failure table and which steps passed before the failure |
| Timeout (10 min) | Report which steps completed, which was active, which were still pending |
| validate-gate.sh reports violations | Include the violations array in the evidence column |
| Directive session crashes | Report the last completed step and suggest checking that step's doc |
| Cleanup fails | Note it -- manual cleanup may be needed for the test branch/directory |

## Rules

- NEVER run this during active directive work -- it creates a test branch that could conflict
- The test directive uses `test_mode: true` in directive.json -- this auto-approves at the completion gate
- The test task is trivial by design (add a comment to a file) -- it should not break anything
- If the smoke test itself fails due to infrastructure (API limits, disk space), that is not a pipeline failure -- note it separately
