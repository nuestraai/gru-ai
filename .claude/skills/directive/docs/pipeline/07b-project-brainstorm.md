## Project-Brainstorm: Task Decomposition

Project brainstorm exists because the COO's plan describes WHAT to build, but the CTO and builder need to determine HOW -- breaking projects into implementable tasks with clear acceptance criteria. The COO thinks in scope and priority; the CTO and builder think in files, dependencies, and sequencing.

**Skipped for:** lightweight directives. The COO's plan for lightweight work is simple enough that tasks can be derived directly in the approve step without a separate decomposition round.

**Runs for:** medium, heavyweight, strategic.

If the project already has a populated `tasks` array (from a prior partial run), skip this step and proceed to execution.

### Participants

| Role | Contribution |
|------|-------------|
| CTO | Technical decomposition, DOD quality, sequencing |
| Assigned builder | Implementation perspective, file-level scope awareness |

For **simple** projects (complexity = `simple`): CTO produces the breakdown solo.
For **moderate/complex** projects: CTO produces initial breakdown, then builder reviews and adjusts.

### Inputs

| Input | Source |
|-------|--------|
| Approved project scope | Project entry from plan.json |
| Audit findings | `audit-findings.json` -- active_files, baseline, recommended_approach |
| Directive brainstorm (if exists) | `.context/directives/{id}/brainstorm.md` |
| Vision guardrails | `.context/vision.md` |
| CEO preferences | `.context/preferences.md` |
| Domain lessons | `.context/lessons/` topic files matched to project domain |

### Brainstorm Prompt

```
You are decomposing a project into executable tasks. The project scope and cast are already decided. Your job is to define the TASKS -- what gets built, in what order, with what acceptance criteria.

PROJECT:
{project entry from the COO's plan -- id, title, scope_summary, agent, reviewers, auditor}

AUDIT FINDINGS:
{audit output for this project's scope area -- active_files, baseline, recommended_approach}

DIRECTIVE BRAINSTORM (if available):
{brainstorm.md content -- approach decisions, key constraints}

For this project, produce a tasks array. Each task is a buildable unit that one engineer completes in one session.

TASK DECOMPOSITION RULES:
- Each task must be completable by the assigned builder in a single focused session
- Tasks execute sequentially by array order -- this IS the dependency mechanism
- Earlier tasks should establish foundations that later tasks build on
- Each task needs 3-5 concrete, testable DOD criteria
- DOD criteria must be verifiable by the reviewer (not vague like "improve quality")
- For UI/visual tasks (files matching *.tsx, *.jsx, *.css, components/, pages/): DOD must
  describe what the USER SEES at default state, not the implementation technique.
  BAD: "Component renders without errors"
  GOOD: "Name labels visible above every character at default zoom (1x)"
  Backend/data/infra tasks keep technical DOD.
- Include the right phases for each task: simple fix = ["build", "review"], integration work = ["build", "code-review", "review"]

OUTPUT (JSON):
{
  "project_id": "the project id",
  "tasks": [
    {
      "id": "task-slug",
      "title": "Human-readable task title",
      "priority": "P0 | P1 | P2",
      "complexity": "simple",
      "phases": ["build", "review"],
      "user_scenario": "One sentence: how the user will experience this change when it ships",
      "scope": "2-4 sentences: what needs to happen in this task",
      "definition_of_done": ["Concrete, testable criterion 1", "Criterion 2", "..."]
    }
  ],
  "sequencing_rationale": "1-2 sentences explaining why the tasks are in this order"
}

CRITICAL: First character `{`, last `}`. JSON only.
```

### After Brainstorm

1. **Parse output** as JSON. If parsing fails, re-prompt.
2. **Write tasks into project.json** -- update the project.json created in the approve step. Each task gets `status: "pending"`, `agent` from the project cast, and `dod` from the brainstorm output (each criterion as `{ "criterion": "...", "met": false }`).
3. **Validate** -- run `validate-project-json.sh` to confirm tasks, DOD, and agent fields are present.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "setup"`.
