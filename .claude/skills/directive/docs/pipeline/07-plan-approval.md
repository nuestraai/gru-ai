## Approve: CEO Plan Review

This step presents the COO's plan (informed by audit data) to the CEO for approval. For lightweight and medium directives, this auto-approves. For heavyweight and strategic, the CEO reviews and can modify.

### Complexity Floor Validation

Since the COO now has audit data during planning, flagrant misclassification is less likely. Still, validate using the audit's `active_files` as mechanical ground truth:

- **>5 active_files** on a task marked simple = flag for re-decomposition
- **>10 active_files or >2 directories** = flag as needing its own project

If any tasks are flagged, re-spawn the COO with flagged tasks + audit findings to decompose further, then re-validate. The audit's file count is mechanical truth that overrides subjective complexity judgment.

### Auto-Approve (Lightweight / Medium)

For lightweight and medium directives, approve automatically based on the directive scope and vision.md guardrails. The CEO reviews results at the completion gate. If the plan touches a guardrail, upgrade to heavyweight instead.

### CEO Presentation (Heavyweight / Strategic)

**CLI session (non-interactive):** Write the full plan to `.context/directives/$ARGUMENTS/plan-for-approval.md`, update directive.json, and stop. The CEO reviews and re-launches.

**CEO session (interactive):** Present as below.

#### TL;DR (present first)

```
## TL;DR
- **What**: {1-sentence goal}
- **Scope**: {N} tasks{, M in K projects if multi-project}
- **Risk**: {COO recommendation -- proceed / scope down / defer}
- **Auto-ships**: {count} low-risk tasks
- **Needs your call**: {count} items need CEO decision

Approve all / Approve with changes / Reject
```

The CEO should be able to approve from the TL;DR alone for most directives.

#### Risk Assessment

Present the COO's built-in challenge (top 3 risks, over-engineering flags, recommendation). If separate challengers ran, include their verdicts (ENDORSE / CHALLENGE / FLAG with reasoning). Highlight any recommendation to scope down.

#### Plan Details (grouped by priority)

For each task: title, priority, complexity, scope, user scenario, audit findings (active files, dead code, recommended approach), phases, cast, DOD items. Flag tasks where the audit found nothing to fix.

#### DOD Review

Before approving, scan each task's DOD items. Flag any that are: too vague to verify, missing CEO-intent alignment, or incomplete (fewer than 3 items). Use "Approve with changes" to request better criteria.

### Create project.json (After Approval)

Once the CEO approves, create project.json -- the source of truth for execution. Builders read it; the dashboard displays it.

1. Create directory: `mkdir -p .context/directives/{id}/projects/{project-id}/`
2. Write `project.json` with fields from the COO's plan (with CEO modifications):

| Field | Source |
|-------|--------|
| `id` | Directive name |
| `title` | COO's plan goal title |
| `status` | `"in_progress"` |
| `priority` | Highest from tasks (P0 > P1 > P2) |
| `agent` | Builder agent IDs from cast |
| `reviewers` | Reviewer agent IDs from cast |
| `description` | Directive brief |
| `source_directive` | Directive name |
| `scope.in` | Aggregated task scopes |
| `scope.out` | Explicit exclusions |
| `dod` | Each criterion as `{ "criterion": "...", "met": false }` |
| `browser_test` | `true` if any task touches UI files |
| `tasks` | From COO's plan, each with `status: "pending"`, `agent`, `dod` |
| `created` | Current ISO 8601 timestamp (use `new Date().toISOString()`) |
| `updated` | Same as `created` |

The key for tasks is `tasks` -- the validator rejects any other key name. If project.json already exists (prior partial run), update it rather than recreating.

### Directive Status State Machine

```
active --> awaiting_completion --> completed
active --> cancelled
awaiting_completion --> reopened --> active
```

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "project-brainstorm"`. Record `planning.ceo_approval` as `{status: "approved", modifications: [...]}` (or rejected). CEO decisions cannot be reconstructed after context loss -- this update is critical.
