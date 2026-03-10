<!-- Pipeline doc: 06-technical-audit.md | Source: SKILL.md restructure, updated by redesign-pipeline-steps -->

## Audit: Technical Audit (Two-Agent Flow)

After the context step, run a two-agent sequential audit: **the QA engineer (Investigation)** (pure data) then **Architect** (design recommendations). This separation prevents investigation findings from anchoring the design. The audit runs BEFORE planning and brainstorm so that codebase reality grounds all downstream decisions.

**Complexity gating:** For directives that touch integration points (data flows between systems, state management, API boundaries) or have moderate/complex scope, use the full two-agent flow. For simple directives with tight scope (single-domain), use the single-agent auditor pattern (skip the QA engineer's investigation, spawn only the named auditor -- defaulting to the CTO -- with the combined prompt from [auditor-prompt.md](../reference/templates/auditor-prompt.md)).

### Phase 1: Investigation

Spawn the QA engineer in investigation mode to scan the codebase and gather raw data. The QA engineer does NOT recommend approaches -- they report facts only.

**Investigation spawn rules:**
- `subagent_type`: the QA engineer's ID from the registry -- operates in investigation mode when given the investigator prompt
- Spawn as Agent (model: opus)
- `run_in_background: true` if multiple investigation groups exist

**The QA engineer's investigation prompt must include:**
- The CEO directive text (the raw directive brief)
- The context gathered in the context step (vision guardrails, lessons, preferences)
- `.context/vision.md` guardrails section -- for constraint awareness
- `.context/preferences.md` -- CEO standing orders
- `.context/lessons/agent-behavior.md` -- agent behavior lessons
- Explicit instruction: "You are operating in INVESTIGATION MODE. Pure data gathering -- scan, measure, report. Do NOT recommend approaches."

> See [docs/reference/templates/investigator-prompt.md](../reference/templates/investigator-prompt.md) for the full investigation prompt template.

> See [docs/reference/schemas/investigation-output.md](../reference/schemas/investigation-output.md) for the investigation output JSON schema.

**Parse the QA engineer's response** as JSON. If it fails to parse, show the error and stop.

### Phase 2: Architecture (Design Recommendations)

Spawn the Architect to read the Investigator's data + the CEO directive and recommend technical approaches. The Architect operates on the raw directive intent -- no plan exists yet.

**The Architect role defaults to the CTO.** If triage assigned a specific auditor, use that agent instead.

**Architect spawn rules:**
- Default to the CTO's `id` from the registry as the `subagent_type`
- If triage assigned a specific auditor, use that agent's `id` instead
- Spawn as Agent (model: opus)

**Architect's prompt must include:**
- Their personality file (for named agents -- auto-loaded via `subagent_type`)
- The CEO directive text
- **The QA engineer's full investigation JSON output** -- this is the Architect's primary input
- **The current directive weight** from `directive.json` -- the Architect compares triage's estimate against codebase reality
- `.context/vision.md` guardrails section -- for risk classification reference
- `.context/preferences.md` -- CEO standing orders
- `.context/lessons/review-quality.md` -- review lessons (for the CTO)
- `.context/lessons/agent-behavior.md` -- agent behavior lessons

**Weight recommendation instruction for the Architect:**
Include in the Architect's prompt: "Compare the directive's current weight (`{weight}`) against what the investigation data reveals. If the codebase shows more complexity than the triage estimated (e.g., >5 active files suggests at least medium, >10 active files or >2 directories suggests heavyweight, cross-system integration suggests strategic), set `weight_recommendation` to the appropriate higher weight with a rationale. If the triage weight is accurate, set `weight_recommendation` to null. Weight can only go UP, never down."

> See [docs/reference/templates/architect-prompt.md](../reference/templates/architect-prompt.md) for the full Architect prompt template.

> See [docs/reference/schemas/audit-output.md](../reference/schemas/audit-output.md) for the Architect's output JSON schema.

**Parse the Architect's response** as JSON. If it fails to parse, show the error and stop.

### After All Audit Phases

**Weight upgrade check:** Read `weight_recommendation` from the Architect's output. If it is not null and is higher than the current `weight` in directive.json:
1. Update `directive.json` field `weight` to the recommended value.
2. Log the upgrade: update `pipeline.audit.output` to include `weight_upgraded_from` and `weight_upgraded_to`.
3. The upgraded weight takes effect immediately -- all downstream steps (brainstorm, plan, approve, execute) use the new weight for skip-set decisions.
Weight can only go UP. If the Architect recommends a weight equal to or lower than the current weight, ignore the recommendation.

**Update directive.json:** Set `current_step: "brainstorm"` (the next step). Update `pipeline.audit` with status/agent/output.

**Artifact:** Write the combined audit output (investigation data + architect recommendations) to the directive directory as `.context/directives/{id}/audit.md`. If design prototype was produced, note its path in the directive.json pipeline object.

The audit findings feed into the brainstorm step (grounding proposals in codebase reality) and the planning step (informing project decomposition).
