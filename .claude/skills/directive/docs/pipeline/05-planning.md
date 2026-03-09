## Plan: COO Strategic Planning

The COO takes the directive brief, context, and audit data and produces a structured plan -- projects, agents, priorities, and scope. The COO plans for all weight classes because even simple work benefits from structured decomposition and agent casting.

Since audit runs before planning, the COO has mechanical data about file counts, complexity scores, and existing code patterns. This produces more accurate plans than guessing at scope.

### Spawn the COO

Spawn the COO agent using your runtime's agent mechanism. Use a high-capability model. Load the COO's personality from the registry (`agentFile` field).

**The COO's prompt includes:**

| Input | Source |
|-------|--------|
| Directive text | `.context/directives/{id}/directive.md` |
| Audit findings | `audit-findings.json` from the audit step |
| Context files | vision.md, preferences.md, lessons, active directives |
| Brainstorm synthesis (if strategic) | `.context/directives/{id}/brainstorm.md` |
| CEO clarification answers (if strategic) | From the brainstorm STOP gate |

Note to include for strategic directives: "The team has brainstormed approach options. Use the synthesis and CEO's answers to inform your plan -- focus on execution planning, not re-deriving strategy."

The COO has audit data (file counts, complexity scores) -- this should drive accurate task complexity assignment rather than optimistic guessing.

> See [planner-prompt.md](../reference/templates/planner-prompt.md) for the full prompt.
> See [plan-schema.md](../reference/schemas/plan-schema.md) for the output schema.
> See [casting-rules.md](../reference/rules/casting-rules.md) for casting rules.
> See [phase-definitions.md](../reference/rules/phase-definitions.md) for phase building blocks.
> See [scope-and-dod.md](../reference/rules/scope-and-dod.md) for scope and DOD rules.

### Parse and Save

Parse the COO's response as JSON (find first `{`, last `}`). If parsing fails, show the error and stop.

Save to `.context/directives/{id}/plan.json`. Do not create project.json at this step -- that happens in the approve step after CEO modifications are incorporated. Creating project.json before approval causes plan/project drift.

### Multi-Project Plans

If the COO's plan contains a `projects` array:

1. **Verify independence** -- if project B depends on project A's output, prefer merging them into one project. If they must stay separate, use the `depends_on` field (see planner-prompt.md). Task array ordering within a project is the intra-project dependency mechanism.
2. Each independent project gets its own project directory, brainstorm, and execution cycle.
3. Projects execute sequentially by priority tier (all P0 before P1).
4. Project directories: `.context/directives/{id}/projects/{project-id}/`

Most directives use a single project. Multi-project is for genuinely complex AND independent work.

### Validate the Cast

Pipe the plan through `validate-cast.sh` for mechanical casting checks:

```bash
echo "$PLAN_JSON" | .claude/hooks/validate-cast.sh
```

The script checks: auditor assigned, builder not in reviewers, complex tasks have C-suite reviewer, no self-review of own behavior. If validation fails, auto-fix clear violations or re-prompt the COO.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "approve"`. Save plan reference to `pipeline.plan.output`.
