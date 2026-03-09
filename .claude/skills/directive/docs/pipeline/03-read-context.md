## Context: Load Project Context

The COO, auditors, and builders all need context about the system's vision, existing work, and past lessons. Loading this once and passing it into agent prompts prevents each agent from independently (and inconsistently) discovering context.

### Read These Files

| File | Purpose | Who Needs It |
|------|---------|-------------|
| `.context/vision.md` | North star + guardrails | All agents |
| `.context/preferences.md` | CEO standing orders | All agents |
| `.context/directives/*/directive.json` | Current directive states | COO |
| `.context/directives/*/projects/*/project.json` | Current project/task status | COO |
| `.context/lessons/agent-behavior.md` | Agent behavior patterns | All agents |
| `.context/lessons/orchestration.md` | Planning lessons | COO |
| `.context/lessons/*.md` (other topic files) | Domain-specific lessons | Matched by role |
| C-suite agent personality files | Agent identities | Resolved from `.claude/agent-registry.json` |

For **lightweight** directives, read a subset: vision.md, preferences.md, agent-behavior.md, and the most relevant lessons. Full context loading is not needed for single-file changes.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step` to the next applicable step (challenge for heavyweight, brainstorm for heavyweight/strategic that includes brainstorm, or audit for lightweight/medium).
