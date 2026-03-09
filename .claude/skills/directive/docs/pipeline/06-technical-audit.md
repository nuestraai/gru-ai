## Audit: Codebase Analysis

Audit runs before planning so the COO has real data about file counts, complexity, and existing code patterns. Without audit data, the COO guesses at complexity and regularly underestimates -- leading to plans that classify 15-file changes as "simple."

The audit uses a two-agent sequential flow: **QA Engineer (investigation)** gathers raw data, then **Architect (design)** recommends approaches. Separating these prevents investigation findings from anchoring design recommendations.

### Complexity Gating

| Scope | Flow |
|-------|------|
| Simple, single-domain project | Single-agent: named auditor (default CTO) with [auditor-prompt.md](../reference/templates/auditor-prompt.md) |
| Integration points, moderate/complex scope | Two-agent: QA investigation then architect recommendations |
| Multi-project plan | Two-agent for each project (group overlapping scopes) |

### Phase 1: Investigation

Spawn the QA engineer to scan the codebase and gather raw data. The QA engineer reports facts only -- no approach recommendations. This separation matters because investigation findings bias design thinking if mixed.

Group projects by scope overlap -- if multiple projects touch similar areas, send them to a single investigation agent to avoid redundant scanning.

**Spawn:** QA engineer from registry. Use a high-capability model. Run in parallel if your runtime supports background agents and there are multiple investigation groups.

**Prompt includes:** The directive scope areas, vision.md guardrails, preferences.md, lessons/agent-behavior.md, and explicit instruction to operate in investigation mode.

> See [investigator-prompt.md](../reference/templates/investigator-prompt.md) for the prompt.
> See [investigation-output.md](../reference/schemas/investigation-output.md) for the output schema.

Parse the response as JSON. If parsing fails, show the error and stop.

### Phase 2: Architecture

Spawn the Architect (the named auditor from the cast, defaulting to CTO) to read the investigation data and recommend technical approaches.

**Prompt includes:** The investigation output, directive scope areas, vision.md guardrails, preferences.md, lessons/review-quality.md, lessons/agent-behavior.md.

> See [architect-prompt.md](../reference/templates/architect-prompt.md) for the prompt.
> See [audit-output.md](../reference/schemas/audit-output.md) for the output schema.

Parse the response as JSON. If parsing fails, show the error and stop.

### After Audit

Write combined output (investigation + architect) to `audit-findings.json` in the project directory. If a project has no active files and all dead code, flag it for removal in the CEO presentation.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "plan"`. Write audit findings to `pipeline.audit.output`.
