<!-- Pipeline doc: 11-completion-gate.md | Source: iteration-fallback directive -->

## Completion: CEO Completion Gate

After the wrapup step generates the digest and reports to the CEO, the directive
enters the completion gate. ALL directives -- including lightweight -- require CEO
sign-off before the status changes to `completed`.

### Status Flow

```
executing -> awaiting_completion -> completed          (approve)
                                 -> reopened [amend]   (~40K tokens, fix items)
                                 -> reopened [extend]  (~80K tokens, delta plan)
                                 -> reopened [redirect](~140K tokens, full replan)
```

### Test Mode Auto-Approve

If `directive.json` has `test_mode: true`, skip CEO interaction and auto-approve:

1. Build the acceptance checklist (for the report) but do NOT present it to the CEO
2. Follow the Approve Flow (Option 1) automatically
3. Log: `[TEST_MODE] Auto-approved completion for {directive-name}`

This is used by the `/smoke-test` skill for pipeline E2E testing. **NEVER** set `test_mode: true` on a real directive -- it bypasses the CEO's completion review.

### Acceptance Checklist

Before presenting options, build an acceptance checklist from every project's DOD.
This is the FIRST thing the CEO sees.

**How to build the checklist:**

1. Read every `project.json` in the directive's `projects[]`
2. For each project, read every task's `dod[]` array
3. For each DOD criterion, determine pass/fail:
   - **Pass**: `met: true` in project.json AND the builder/reviewer logged evidence
   - **Fail**: `met: false` OR no evidence logged
4. Collect evidence from: task build reports, review findings, browser test results,
   `git diff --stat` output for changed files

**Present to the CEO as a table per project:**

```
## Acceptance Checklist

### Project: {project-title} ({project-id})

| # | Criterion                                    | Result | Evidence                          |
|---|----------------------------------------------|--------|-----------------------------------|
| 1 | Name labels visible above every character... | PASS   | Verified in review, screenshot #3 |
| 2 | Settings panel shows all 5 categories...     | PASS   | Browser test passed               |
| 3 | No horizontal scroll at 100% zoom            | FAIL   | Reviewer noted overflow on mobile |

### Project: {project-title-2} ({project-id-2})

| # | Criterion                                    | Result | Evidence                          |
|---|----------------------------------------------|--------|-----------------------------------|
| 1 | API returns 200 for valid payloads           | PASS   | Integration test green            |
| 2 | Error response includes field-level details  | PASS   | Manual curl test in build report  |
```

**Also include after the checklist:**

- `git diff --stat main..directive/$ARGUMENTS` showing this directive's changes
- Review findings that need attention (from review-gate)
- Tasks with `failed` or `partial` status, with explanations from the digest
- Digest summary (key points, not the full file)

### CEO Options

After the CEO reviews the acceptance checklist, present exactly four options:

```
Directive {name} -- acceptance checklist above.

1. APPROVE   -- All work is satisfactory. Mark completed.
2. AMEND     -- Small fixes needed. Specify items. (~40K tokens, restarts at execute)
3. EXTEND    -- Add new scope. COO plans delta projects only. (~80K tokens, restarts at plan)
4. REDIRECT  -- Scope has changed. Full replan from updated intent. (~140K tokens, restarts at plan)

Which option? If amend/extend/redirect, describe what needs to change.
```

---

### Option 1: Approve Flow

When the CEO approves:

1. Update `.context/directives/{id}/directive.json`:
   - Set `status` to `"completed"`
   - Set `completed` to today's date (`YYYY-MM-DD`)
   - Set `pipeline.completion.status` to `"completed"`
   - Update `updated_at` to current ISO timestamp
2. Update all project.json files in the directive's `projects[]`:
   - If all tasks completed, set project `status` to `"completed"`
3. Log: `[COMPLETED] Directive {name} approved by CEO`

---

### Option 2: Amend Flow

Small fix without re-planning. The CEO specifies exact fix items. Existing completed
work is untouched -- only the fix items execute.

**When to use:** A DOD criterion failed but the fix is straightforward. A reviewer
flagged a minor issue. A small behavior is wrong. The scope has NOT changed -- just
the execution was incomplete.

**CEO prompt:** "What specific items need fixing? (Each becomes a task in a fix project)"

**directive.json mutations:**

```json
{
  "status": "reopened",
  "revision": "{previous + 1}",
  "iterations": [
    "...existing entries...",
    {
      "opened_at": "{ISO datetime}",
      "reason": "{CEO's feedback verbatim}",
      "type": "amend",
      "items": ["{fix item 1}", "{fix item 2}"]
    }
  ]
}
```

Note: `intent_version` is NOT incremented -- amend does not change scope.

**Pipeline restart:**

1. Create a new fix project in `projects/{directive-id}-amend-r{revision}/`:
   - project.json with the CEO's fix items as tasks
   - Each task gets `dod` criteria derived from the CEO's description
   - `agent` and `reviewers` carried from the original project cast
2. Update `directive.json`:
   - Add the fix project to `projects[]`
   - Set `current_step` to `"execute"`
   - Set `pipeline.execute.status` to `"active"`
3. Resume pipeline at **execute step** -- skip triage, read, context, audit, plan,
   approve, project-brainstorm, setup
4. After execution completes, flow continues through review-gate, wrapup, and back
   to this completion gate

**Log:** `[AMEND] Directive {name} -- revision {n}, {count} fix items`

---

### Option 3: Extend Flow

Add new scope. The COO plans delta projects to cover what is missing. Existing
completed projects stay untouched.

**When to use:** The original scope was delivered correctly, but the CEO realizes
more is needed. New requirements surfaced during review. An adjacent area needs the
same treatment. The original intent is still valid -- just broader now.

**CEO prompt:** "What additional scope is needed? (COO will plan new projects for this)"

**directive.json mutations:**

```json
{
  "status": "reopened",
  "revision": "{previous + 1}",
  "intent_version": {
    "version": "{previous + 1}",
    "reason": "{CEO's description of new scope}",
    "updated_at": "{ISO datetime}"
  },
  "iterations": [
    "...existing entries...",
    {
      "opened_at": "{ISO datetime}",
      "reason": "{CEO's feedback verbatim}",
      "type": "extend",
      "items": ["{new scope item 1}", "{new scope item 2}"]
    }
  ]
}
```

**Pipeline restart:**

1. Update `directive.json`:
   - Set `current_step` to `"plan"`
   - Set `pipeline.plan.status` to `"active"`
2. Resume pipeline at **plan step** -- the COO plans NEW projects only
   - The COO receives the existing completed projects as context (do not duplicate)
   - The COO receives the CEO's extend feedback as the new scope input
   - Only delta projects are planned -- existing completed work is not re-planned
3. After plan, flow continues through approve, project-brainstorm, setup, execute,
   review-gate, wrapup, and back to this completion gate

**Log:** `[EXTEND] Directive {name} -- revision {n}, intent v{v}, new scope: {summary}`

---

### Option 4: Redirect Flow

The scope has fundamentally changed. Full replan from the plan step with updated
intent. The COO may replace pending projects or plan an entirely new approach.
Existing completed projects remain in history but the COO is free to supersede them.

**When to use:** The CEO's understanding of the problem shifted. The original
approach was wrong. Review revealed the directive should target something different.
This is rare -- most reopens are amend or extend.

**CEO prompt:** "What has changed about the directive's intent? (COO will replan from scratch)"

**directive.json mutations:**

```json
{
  "status": "reopened",
  "revision": "{previous + 1}",
  "intent_version": {
    "version": "{previous + 1}",
    "reason": "{CEO's description of intent change}",
    "updated_at": "{ISO datetime}"
  },
  "iterations": [
    "...existing entries...",
    {
      "opened_at": "{ISO datetime}",
      "reason": "{CEO's feedback verbatim}",
      "type": "redirect",
      "items": ["{redirect rationale}"]
    }
  ]
}
```

**Pipeline restart:**

1. Update `directive.json`:
   - Set `current_step` to `"plan"`
   - Set `pipeline.plan.status` to `"active"`
2. Resume pipeline at **plan step** -- the COO replans with full latitude
   - The COO receives the updated intent from the CEO's redirect feedback
   - The COO receives the history of completed projects (for context, not constraint)
   - The COO may plan entirely new projects or reuse scope from existing ones
   - Pending (not-yet-started) projects from the previous iteration can be replaced
3. After plan, flow continues through approve, project-brainstorm, setup, execute,
   review-gate, wrapup, and back to this completion gate

**Log:** `[REDIRECT] Directive {name} -- revision {n}, intent v{v}, replan: {summary}`

---

### Non-Interactive Sessions

When the directive runs as a CLI session (non-interactive):

- Write the digest to `.context/reports/`
- Build the acceptance checklist and write it to
  `.context/directives/{id}/acceptance-checklist.md`
- Set status to `awaiting_completion`
- The CEO reviews and acts via a subsequent session or dashboard action
- The directive is NOT done until the CEO explicitly chooses an option

### Update directive.json

Set `current_step: "completion"`. Set `pipeline.completion.status` to
`"awaiting_completion"` with the digest path and checklist summary.
