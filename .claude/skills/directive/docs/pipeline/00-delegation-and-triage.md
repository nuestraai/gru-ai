## Triage: Weight Classification

Triage determines how much process overhead a directive needs. A one-file config change does not need C-suite challenges and CEO approval gates. A cross-system auth redesign does. Getting this right saves time on simple work and prevents quality gaps on complex work.

### Pre-flight Cleanup

Kill orphaned agent processes from prior runs. These accumulate when a directive session dies mid-execution (context limit, timeout, cancellation) and child processes keep running as zombies. Left unchecked, they saturate API rate limits and cause new spawns to hang.

Adapt the cleanup pattern to your runtime. Example for Claude Code:

```bash
# Example (Claude Code): kill orphaned claude agent processes
ps aux | grep "claude.*--agent.*-p" | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null
ps aux | grep "claude -p" | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null
echo "Pre-flight cleanup: killed orphaned agent processes"
```

This is safe -- active agents for the current directive haven't been spawned yet.

### Read Before Classifying

1. Read the directive: `.context/directives/$ARGUMENTS/directive.md`
2. Read `.context/vision.md` (guardrails)
3. Read `.context/preferences.md` (if it exists)

### Weight Classes

| Weight | When to Use | Key Characteristics |
|--------|------------|---------------------|
| Lightweight | Single clear task, well-understood files, no user-facing impact, no guardrail risk | 1-5 predicted files, one engineer |
| Medium | 2-3 related tasks, one system, low-to-moderate risk | 6-10 predicted files, coordination needed |
| Heavyweight | Crosses system boundaries, touches sensitive areas (revenue, auth, user data), architectural decisions | 10+ predicted files or 2+ domains |
| Strategic | Multiple valid approaches, problem without prescribed solution, lasting consequences | Same as heavyweight + approach ambiguity |

### Mechanical Classification Floor

Predicted file counts provide a mechanical floor that overrides subjective judgment. LLMs tend to underestimate complexity -- these thresholds correct for that.

- **>5 predicted files** = at least medium (even if the work "feels" simple)
- **>10 predicted files or >2 directory domains** = at least heavyweight
- These are floors, not ceilings -- a 3-file auth change is still heavyweight because of domain sensitivity

### Security Classification

Security work is easy to misclassify. The distinction is whether you're hardening existing behavior or changing access patterns:

- **Hardening** (fixing injection, removing hardcoded creds, adding validation to existing routes) = **Medium**
- **Changing access** (new auth flows, modifying access controls, session handling changes) = **Heavyweight**

### Triage Output

```
Directive: {name}
Classification: {lightweight | medium | heavyweight | strategic}
Reasoning: {1-2 sentences why}
Process: {which steps will run}
```

### Process by Weight

| Step | Lightweight | Medium | Heavyweight | Strategic |
|------|:-----------:|:------:|:-----------:|:---------:|
| triage | yes | yes | yes | yes |
| checkpoint | yes | yes | yes | yes |
| read | yes | yes | yes | yes |
| context | partial | full | full | full |
| challenge | skip | skip | yes | yes |
| brainstorm | skip | skip | Phase 1 | Phase 1 + deliberation |
| audit | lightweight | full | full | full |
| plan (COO) | yes | yes | yes | yes |
| approve | auto | auto | CEO gate | CEO gate |
| project-brainstorm | auto (from plan) | yes | yes | yes |
| setup | yes | yes | yes | yes |
| execute | yes | yes | yes | yes |
| review-gate | yes | yes | yes | yes |
| wrapup | short digest | full | full | full |
| completion | CEO gate | CEO gate | CEO gate | CEO gate |

**"auto" for approve** means no CEO gate -- the plan proceeds based on directive scope and guardrails. The CEO reviews results at the completion gate.

**"auto" for project-brainstorm (lightweight)** means tasks are derived directly from the COO's plan in the approve step, without spawning a separate CTO + builder decomposition. The COO's plan for lightweight directives is simple enough that this extra step adds no value.

### Brainstorm Timing

Brainstorm runs before the COO plans, so the team's approach analysis feeds into planning rather than validating it after the fact.

| Weight | Brainstorm | Timing | Artifact |
|--------|-----------|--------|----------|
| Lightweight | None | -- | -- |
| Medium | None | -- | -- |
| Heavyweight | Phase 1 only | Before COO plan | brainstorm.md |
| Strategic | Phase 1 + deliberation | Before COO plan | brainstorm.md |

### Heavyweight Brainstorm

Spawn 2-3 relevant C-suite agents in parallel. Each receives the Phase 1 prompt from [brainstorm-prompt.md](../reference/templates/brainstorm-prompt.md). Pick agents based on directive domain: CTO for architecture, CPO for product, CMO for growth. Use a lightweight model for brainstorm (it's approach exploration, not code).

Collect results from all spawned agents, synthesize convergence and disagreements, write to `.context/directives/{id}/brainstorm.md`. No deliberation round for heavyweight -- proposals only. Clarifying questions go into the plan-for-approval artifact rather than as a separate CEO round-trip.

> See [brainstorm-output.md](../reference/schemas/brainstorm-output.md) for the output schema.

If a brainstorm agent fails, continue with remaining proposals. If all fail, note "brainstorm phase failed" and proceed -- the COO derives the approach independently.

### Strategic Brainstorm

Same as heavyweight Phase 1, plus a deliberation round: after collecting proposals, spawn each agent again with all proposals visible. Each writes one rebuttal targeting the proposal they most disagree with (Phase 2 prompt from [brainstorm-prompt.md](../reference/templates/brainstorm-prompt.md)).

After collecting rebuttals, synthesize to brainstorm.md. Write 2-3 clarifying questions based on unresolved disagreements, then STOP and return to CEO: "This directive is strategic. The team brainstormed N approaches and debated. Here are questions before we proceed."

After CEO answers, feed synthesis + answers into the COO's prompt and continue from the plan step.

### CEO Session Rule

The CEO session triages, delegates, and reviews. It does not plan or build -- that is what the pipeline agents are for. This applies to all weights, including lightweight.

### Update directive.json

After triage, update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "checkpoint"`, write the triage output to `pipeline.triage.output`.
