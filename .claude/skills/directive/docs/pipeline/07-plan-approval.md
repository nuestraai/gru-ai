<!-- Pipeline doc: 07-plan-approval.md | Source: SKILL.md restructure -->

## Approve: Present Combined Plan to CEO

### Pre-approval: Complexity Floor Check

After the audit and before presenting the plan, validate that all projects are sized appropriately using the audit's `active_files` as mechanical ground truth:

- If a project scope spans **>10 active_files** or **>2 directories**: it may need splitting into multiple projects or additional brainstorm.
- Log any flags: `[COMPLEXITY FLAG] {project title}: spans 12 active files across 3 dirs -- verify decomposition is adequate`

**If any projects are flagged:**
1. Re-spawn the COO with the flagged projects + audit findings, instructing them to split or add brainstorm
2. Re-validate the updated plan
3. Present the final plan to CEO

This prevents the COO (an LLM optimistic about complexity) from under-splitting. The audit's active_files count is mechanical ground truth that overrides the COO's judgment. Note: task-level complexity is checked later in the project-brainstorm step.

---

### Test Mode Auto-Approve

If `directive.json` has `test_mode: true`, skip the CEO presentation and auto-approve
the plan:

1. The pre-approval complexity floor check above MUST have already run
2. The COO's plan MUST have already been constructed (plan.json exists)
3. Auto-approve the plan as-is -- do NOT present the TL;DR, challenges, or plan to the CEO
4. Proceed directly to "Create project.json" below -- project.json creation still runs normally
5. Log: `[TEST_MODE] Auto-approved plan for {directive-name}`
6. Set `planning.ceo_approval` to `{status: "approved", modifications: [], test_mode: true}`

This is used by the `/smoke-test` skill for pipeline E2E testing. **NEVER** set
`test_mode: true` on a real directive -- it bypasses the CEO's plan review.

If `test_mode` is not set, proceed to the presentation logic below.

---

**If running in a dedicated CLI session (non-interactive):** Write the full plan to `.context/directives/$ARGUMENTS/plan-for-approval.md` using the format below, update directive.json, and stop. The CEO reviews and re-launches with approval.

**If running inline (CEO session):** Present as described below.

### CEO Quick Summary (present FIRST — before any detail)

Always lead with a 3-5 bullet TL;DR that the CEO can read in 20 seconds:

```
## TL;DR

- **What**: {1-sentence goal}
- **Scope**: {N} tasks{, M in K projects if multi-project}
- **Risk**: {the COO's recommendation -- proceed / scope down / defer}
- **Auto-ships**: {count} low-risk tasks execute without approval
- **Needs your call**: {count} items need CEO decision {brief description}

Approve all / Approve with changes / Reject
```

The CEO should be able to approve from the TL;DR alone for medium-risk directives. The full detail below is for heavyweight review or "Approve with changes" scenarios.

### Challenges (from the COO's inline analysis + brainstorm step if brainstorm agents were spawned)

First, present the COO's built-in challenge analysis:

```
## Risk & Scope Assessment (COO)

Risks: {the COO's top 3 risks from challenges.risks}
Over-engineering flags: {challenges.over_engineering_flags}
Recommendation: {challenges.recommendation}
```

If brainstorm agents were spawned (heavyweight/strategic directives only), present their challenge assessments:

```
**{Agent Name}** ({confidence} confidence)
Challenge: {challenge assessment -- risks, scope concerns, alternatives}
Approach: {approach summary}
Tradeoffs: {tradeoffs}
Feasibility: {feasibility_flags from auditor}
```

If any challenge assessment recommends scoping down or modifying the directive, highlight it prominently. The CEO should consider the challenge before approving the plan.

### Plan (from plan + audit steps)

Merge the COO's strategic plan with the audit findings and present **grouped by priority**:

For each project, display:
- Title + priority + complexity
- Scope summary (from the COO)
- Agent cast (builder + reviewers)
- Audit findings: active files, dead code flagged, recommended approach
- Dependencies (if multi-project with depends_on)

Note: The COO outputs projects with scope, NOT tasks with DOD. Task decomposition and DOD happen in the project-brainstorm step (after approval). The CEO reviews project-level scope and agent casting here.

Example format:
```
## P0 — Must Ship

  1. {Project Title} ({complexity}) — {cast: builder → reviewer}
     Scope: {the COO's scope_summary}
     Audit: {baseline} | {N} active files | {M} dead code files flagged
     Approach: {auditor's recommended approach}

  2. {Project Title} — RECOMMEND REMOVE
     Audit: No active issues found. {explanation}

## P1 — Should Ship
  ...

## P2 — Nice to Have
  ...
```

Ask the CEO to approve using AskUserQuestion:
- "Approve all" — execute everything as planned
- "Approve with changes" -- CEO adjusts priorities or removes tasks
- "Reject" — stop, explain what's wrong

**Scope review guidance:** Before approving, scan each project's scope. Flag any that are:
- Too vague to execute ("improve quality" vs "add Zod validation to all API routes")
- Missing CEO-intent alignment (scope doesn't address what you actually want from the directive)
- Over-scoped (could be split into independent projects)

If scope is unclear, use "Approve with changes" to refine before execution starts. Detailed task DOD is produced in the next step (project-brainstorm).

If CEO wants changes, adjust the plan accordingly.

### Create project.json (after CEO approves)

Once the CEO approves (or approves with changes), create the project.json — this is the source of truth for execution. Builders read it to know what to do. The dashboard shows it for progress tracking.

1. Create directory: `mkdir -p .context/directives/{directive-id}/projects/{project-id}/` (for each project in the COO's plan)
2. Write `project.json` with fields derived from the COO's plan (incorporating any CEO modifications):
   - `id`: project slug from the COO's plan (e.g. `"update-schemas"`, `"build-dashboard-widget"`)
   - `title`: from the COO's plan goal title
   - `status`: `"in_progress"`
   - `priority`: highest priority from tasks (P0 > P1 > P2)
   - `agent`: array of builder agent IDs from the COO's cast (e.g. `["frontend-engineer-id"]`, `["backend-engineer-id", "data-engineer-id"]`)
   - `reviewers`: array of reviewer agent IDs from the COO's cast (e.g. `["cto-id"]`, `["cto-id", "cpo-id"]`)
   - `description`: from the directive brief
   - `source_directive`: directive name
   - `scope.in`: aggregated from all task scopes
   - `scope.out`: anything explicitly excluded
   - `dod`: project-level DOD from the COO's scope — each criterion starts as `{ "criterion": "...", "met": false }`
   - `browser_test`: `true` if project scope touches UI files (based on audit active_files)
   - `tasks`: `[]` (empty — tasks are populated by the project-brainstorm step). **CRITICAL: The key MUST be `tasks`.** The validator will reject any other key name.
   - `created`: current ISO 8601 timestamp with actual time (e.g. `new Date().toISOString()` — NEVER use `T00:00:00Z` placeholder)
   - `updated`: same as `created` initially

3. If the project.json already exists (from a prior partial run or brainstorm), UPDATE it — don't overwrite existing tasks. Apply any CEO modifications from "Approve with changes."

This project.json will be populated by the project-brainstorm step with the full `tasks` array (CTO decomposes projects into tasks with DOD), then updated incrementally during execution as tasks complete and reviews finish.

**Next step:** Proceed to [07b-project-brainstorm.md](07b-project-brainstorm.md) (project-brainstorm) to decompose each project into tasks with DOD.

**Update directive.json:** Set `current_step: "project-brainstorm"` (the next step), `planning.ceo_approval` to `{status: "approved", modifications: [...]}` (or rejected). Update `pipeline.approve.status` to `"completed"` with output. This is CRITICAL -- CEO decisions cannot be reconstructed after context loss.
