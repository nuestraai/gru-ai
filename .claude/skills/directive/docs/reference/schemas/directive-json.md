<!-- Reference: directive-json.md | Source: SKILL.md restructure -->

# directive.json — THE Single Source of Truth

directive.json is the ONLY state file for a directive. It stores metadata, pipeline progress, per-step outputs, and project references. There is NO separate checkpoint file — directive.json IS the checkpoint.

**File:** `.context/directives/{directive-name}/directive.json`

```json
{
  "id": "$ARGUMENTS",
  "title": "{extracted from first heading of the .md}",
  "status": "in_progress",
  "created": "{today's date YYYY-MM-DD}",
  "completed": null,
  "weight": "{classification from triage step}",
  "produced_features": [],
  "report": null,
  "backlog_sources": [],

  "dod": {
    "success_looks_like": [
      "Pipeline completes without CEO intervention after initial brief",
      "Builder output matches the quality bar on first review cycle"
    ],
    "failure_looks_like": [
      "CEO has to re-explain intent after the brief is submitted",
      "Review-gate fails due to missing requirements that were in the brief"
    ],
    "quality_bar": "All DOD criteria met with no regressions; code review passes on first cycle",
    "examples": [
      "Before: CEO writes 'improve the dashboard' → builder guesses what to improve → 3 review cycles",
      "After: CEO writes brief → pipeline extracts DOD → builder knows exact acceptance criteria → 1 review cycle"
    ]
  },

  "revision": 0,
  "intent_version": { "version": 1, "reason": null, "updated_at": null },
  "iterations": [],

  "started_at": "ISO datetime",
  "updated_at": "ISO datetime",
  "current_step": "triage | checkpoint | read | context | audit | brainstorm | clarification | plan | approve | project-brainstorm | setup | execute | review-gate | wrapup | completion",

  "pipeline": {
    "triage": {
      "status": "completed",
      "agent": "CEO",
      "output": { "weight": "medium", "rationale": "..." }
    },
    "checkpoint": {
      "status": "completed",
      "agent": "CEO",
      "output": { "summary": "No existing checkpoint found" }
    },
    "read": {
      "status": "completed",
      "agent": "CEO",
      "output": { "summary": "..." }
    },
    "context": {
      "status": "completed",
      "agent": "CEO",
      "output": { "summary": "Read vision.md, goals, lessons..." }
    },
    "audit": {
      "status": "completed",
      "agent": "CTO",
      "output": { "summary": "...", "findings": 3 },
      "artifacts": [".context/directives/{id}/audit.md"]
    },
    "brainstorm": {
      "status": "completed",
      "agent": ["sarah", "marcus", "morgan"],
      "output": { "summary": "..." },
      "artifacts": [".context/directives/{id}/brainstorm.md"]
    },
    "clarification": {
      "status": "completed",
      "agent": "CEO",
      "output": { "summary": "CEO answered 2 clarification questions" }
    },
    "plan": {
      "status": "completed",
      "agent": "COO",
      "output": { "goal": "...", "projects": "..." },
      "artifacts": [".context/directives/{id}/plan.json"]
    },
    "approve": {
      "status": "completed",
      "agent": "CEO",
      "output": { "decision": "approved", "modifications": [] }
    },
    "project-brainstorm": {
      "status": "completed",
      "agent": "CTO + builder",
      "output": { "summary": "Task breakdown and DOD produced per project" },
      "artifacts": [".context/directives/{id}/projects/{project-id}/project.json"]
    },
    "setup": {
      "status": "completed",
      "agent": "CEO",
      "output": { "mode": "branch", "branch": "directive/{id}" }
    },
    "execute": {
      "status": "active",
      "agent": "frontend-engineer",
      "reviewers": ["CTO"],
      "output": { "progress": "1/3 complete", "current": "project-name" }
    },
    "review-gate": { "status": "pending" },
    "wrapup": { "status": "pending", "agent": "CEO" },
    "completion": { "status": "pending", "agent": "CEO" }
  },

  "projects": [
    {
      "id": "project-slug",
      "status": "pending | in_progress | completed | failed"
    }
  ],

  "planning": {
    "coo_plan": {},
    "ceo_approval": { "status": "approved|rejected|auto-approved", "modifications": [] },
    "worktree_path": "string | null"
  },

  "wrapup": {
    "follow_ups_processed": false,
    "digest_path": null,
    "lessons_updated": false
  }
}
```

### Status enum
Valid values for `status`: `pending`, `triaged`, `in_progress`, `awaiting_completion`, `completed`, `failed`, `reopened`, `cancelled`.

<!-- Status lifecycle:
  planned → active (triage assigns weight, pipeline starts)
  active → awaiting_completion (all tasks done, wrapup produced)
  awaiting_completion → completed (CEO approves)
  awaiting_completion → reopened via amend (small fix, no re-plan -- adds iteration, increments revision)
  awaiting_completion → reopened via extend (new scope -- adds iteration, increments revision + intent_version)
  awaiting_completion → reopened via redirect (scope change -- adds iteration, increments revision + intent_version, re-plans)
  reopened (amend) → active (fix projects execute, skip plan step)
  reopened (extend) → active (COO plans delta projects only)
  reopened (redirect) → active (COO re-plans from updated intent)
  any → cancelled (CEO cancels directive)
-->

- `awaiting_completion` -- all work done, wrapup produced, waiting for CEO to approve completion
- `reopened` -- CEO reopened after completion via amend, extend, or redirect (see iterations[])
- `cancelled` -- CEO cancelled the directive; no further work

### Pipeline step statuses
Each step in `pipeline` has: `status` (pending|active|completed|skipped|failed), `agent` (array of lowercase agent first names, e.g. `["sarah", "marcus"]`, consistent with project.json), `output` (key-value summary of what happened), and optional `artifacts` (file paths to detailed outputs). The game UI reads `agent` to show agents as working and route them to the meeting room.

### Projects
The `projects[]` array contains lightweight references. Each entry has `id` (matching the project directory name under this directive) and `status`. The full project detail (tasks, DOD, agents) lives in `projects/{id}/project.json` — directive.json does NOT duplicate task-level data.

### Definition of Done (dod)
The `dod` object captures the CEO's definition of success at the directive level. It flows downstream to project-brainstorm (task DOD derivation), builder prompts (quality targeting), and review-gate (pass/fail criteria). Fields:

- **success_looks_like** (string[]) -- observable outcomes when the directive succeeds. Concrete and verifiable, not aspirational.
- **failure_looks_like** (string[]) -- observable outcomes when the directive fails. Helps builders avoid known anti-patterns.
- **quality_bar** (string) -- the minimum acceptable standard. One sentence. Used by reviewers to calibrate pass/fail.
- **examples** (string[]) -- before/after or reference examples that illustrate the quality bar. Optional but strongly recommended for heavyweight/strategic directives.

The read step populates `dod` best-effort from the CEO brief. The clarification step verifies and refines it with the CEO. If the brief is too vague to extract any DOD, set all fields to empty arrays/strings -- the clarification step will fill them in.

### Test Mode (test_mode)
Optional boolean, absent by default. When `true`, the completion gate auto-approves without CEO interaction. Used exclusively by the `/smoke-test` skill for pipeline E2E testing. **NEVER** set on real directives -- it bypasses the CEO's completion review.

### Iteration tracking (revision, iterations[], intent_version)

These fields track directive reopens. They are the mechanism for the CEO's "amend", "extend", and "redirect" actions at the completion gate.

- **revision** (integer, starts 0) -- incremented each time the directive is reopened. A directive that completed on the first pass has `revision: 0`. A directive reopened twice has `revision: 2`.
- **iterations[]** (array) -- one entry per reopen. Each entry:
  - `opened_at` (ISO datetime) -- when the CEO reopened
  - `reason` (string) -- CEO's feedback or justification
  - `type` ("amend" | "extend" | "redirect") -- controls how much of the pipeline reruns:
    - **amend** -- small fix, no re-planning. Fix projects execute directly, skip plan step.
    - **extend** -- new scope added. COO plans delta projects only; existing completed projects untouched.
    - **redirect** -- scope changed. COO re-plans from updated intent; may replace pending projects.
  - `items` (string[]) -- specific deliverables or changes requested
- **intent_version** (object) -- tracks scope changes to the directive's intent:
  - `version` (integer, starts 1) -- incremented on extend or redirect (NOT on amend, since amend does not change scope)
  - `reason` (string | null) -- why the intent changed, null until first scope change
  - `updated_at` (string | null) -- ISO datetime of last scope change, null until first scope change

On first creation, set `revision: 0`, `intent_version: { version: 1, reason: null, updated_at: null }`, `iterations: []`.

### Write protocol
Use the Write tool to overwrite the entire directive.json. Always update `updated_at` to the current ISO timestamp. Update `pipeline.{step}.status` and `pipeline.{step}.output` after each step completes.

### On completion (wrapup + completion gate)
- Set `status` to `"awaiting_completion"` (CEO must approve)
- CEO reviews digest and either:
  - **Approves** -- status = `"completed"`, set `completed` to today's date
  - **Amends** -- status = `"reopened"`, increment `revision`, append to `iterations[]` with `type: "amend"`. Pipeline resumes at execute (skip plan).
  - **Extends** -- status = `"reopened"`, increment `revision` and `intent_version.version`, append to `iterations[]` with `type: "extend"`. COO plans delta projects only.
  - **Redirects** -- status = `"reopened"`, increment `revision` and `intent_version.version`, append to `iterations[]` with `type: "redirect"`. COO re-plans from updated intent.
- Set `report` to the digest filename
- `pipeline` data stays -- it is the permanent execution record
- `iterations[]` is append-only -- never remove previous entries, they form the audit trail

Directives live in `directives/{id}/` — a directory per directive containing directive.json, directive.md, and all artifacts.
