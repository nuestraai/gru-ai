## Challenge: C-Suite Risk Assessment

Challenge exists because the COO optimizes for execution speed and may underweight risks that cross domain boundaries. A second opinion from the CTO (security), CPO (user impact), or CMO (positioning) catches blind spots before planning commits to an approach.

**Skipped for:** lightweight, medium. The COO's inline challenge (built into the planning prompt) is sufficient when risk is low.

**Runs for:** heavyweight. Separate challengers provide independent risk assessment.

### When to Spawn Separate Challengers

The default challenge is inlined into the COO's planning prompt -- the COO identifies top 3 risks and over-engineering flags as part of planning output. Separate challenger agents add value when:

- The CEO explicitly flags the directive as controversial
- The directive crosses multiple domains (e.g., touches revenue + auth + UI)

### Agent Selection

| Domain | Challenger |
|--------|-----------|
| Security / architecture / tech debt | CTO |
| User-facing features / product changes | CPO |
| Growth / SEO / positioning | CMO |
| Crosses 2+ domains | Spawn the two most relevant |

### Spawn Pattern

Challengers run in parallel using your runtime's background/concurrent agent mechanism. Use a lightweight model -- this is a gut-check, not deep analysis.

> See [challenger-prompt.md](../reference/templates/challenger-prompt.md) for the prompt template.
> See [challenger-output.md](../reference/schemas/challenger-output.md) for the output schema.

Collect results from all spawned challengers. If a challenger fails, continue -- challenge is advisory and does not block the pipeline. Store challenges for the approve step.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "brainstorm"` (if heavyweight/strategic) or `"audit"` (if brainstorm is skipped).
