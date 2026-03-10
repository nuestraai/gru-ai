<!-- Reference: phase-definitions.md | Source: SKILL.md restructure -->

# Phase Definitions — Composable Building Blocks

Instead of picking from a fixed process type taxonomy, specify the exact phases each task needs as an ordered array. Available phases:

- "research" — investigation, analysis, competitive intel (researcher agent)
- "product-spec" — product requirements + acceptance criteria (the CPO)
- "design" — technical approach document (the CTO)
- "visual-design" — pre-build visual design spec (the UI/UX designer). For UI tasks. Designer produces layout, component structure, visual spec, interactions. Builder receives as context during build.
- "keyword-research" — SEO keyword analysis (the CMO, for content work)
- "outline" — content structure and plan (the CMO, for content work)
- "clarification" — pre-build Q&A between engineer and designer/auditor (auto-added for complex work)
- "build" — implementation (engineer agent)
- "draft" — content writing (engineer, for content work)
- "seo-review" — SEO quality review (the CMO, for content work)
- "code-review" — independent review using cast reviewers with full files + diff but no builder reasoning (fresh eyes catch bugs). Fail triggers fix cycle (max 3 rounds with convergence detection).
- "design-review" — UI/UX design review by the assigned reviewer (for UI-touching tasks). Checks visual quality, layout, interactions against the visual-design spec.
- "review" — code/quality review (reviewer agents from cast — checks DOD, user perspective, corrections). Fail triggers fix cycle (max 2 rounds).
- "tech-review" — architecture review (the CTO, for complex work)
- "product-review" — product spec verification (the CPO, for complex work)

## Common Phase Patterns (guidance, not rigid rules)

- Simple fix: ["build", "review"]
- Integration-touching fix: ["build", "code-review", "review"]
- UI task (design-first): ["visual-design", "build", "code-review", "design-review", "review"]
- Complex UI task: ["design", "visual-design", "clarification", "build", "code-review", "design-review", "review"]
- Complex project task: ["design", "clarification", "build", "code-review", "review"] (only within multi-project plans)
- Research only: ["research"] (no build — produces a report)
- Migration: ["research", "design", "clarification", "build", "review"] (build is incremental)
- Content: ["keyword-research", "outline", "draft", "seo-review", "review"]

## Code-Review Phase Rules

- Include "code-review" between "build" and "review" when the task touches integration points (data flows between systems, state management, API boundaries) or has >3 DOD criteria
- Skip for trivial fixes (rename, config change, single-file edit with 1-2 DOD criteria)
- The code-review phase uses the SAME reviewers from the cast, but with full files + diff and NO builder reasoning/design docs. Fresh eyes catch bugs that contextual reviewers miss.
- If the builder is also in the reviewers list, they are skipped for code-review (conflict of interest).
- **Failure blocking:** If `code_review_outcome` = `fail` or `critical`, stop and re-spawn the builder with the findings. Re-run code-review on the updated diff. **Max 3 fix cycles** per task with convergence detection -- if the same bug (same file + description) recurs in 2 consecutive cycles, escalate instead of cycling. If still failing after 3 cycles, log findings and proceed to the standard review phase.
- For moderate/complex tasks inside projects: always include code-review.

## Review Phase Rules

- Standard review checks DOD, user perspective, corrections, and default-state (UI tasks). Full prompt in `09-execute-projects.md`.
- **Failure fix cycles:** If `review_outcome` = `"fail"`, re-spawn the builder with the reviewer's findings, then re-run standard review. **Max 2 fix cycles** per task. If still failing after 2 cycles, log findings as non-fatal and proceed. `"critical"` outcomes (guardrail violations) escalate immediately -- no fix cycle.
- **Total fix budget per task:** Up to 3 code-review cycles + 2 standard review cycles = 5 maximum. Each review type catches different issue classes (code-review: bugs and data flow; standard review: DOD, user workflow, corrections).

## Clarification Phase Rules

- Auto-add "clarification" before "build" when the task has "design", "research", or "product-spec" phases
- Skip clarification for simple ["build", "review"] tasks — scope is tight enough
- Skip for ["research"] only tasks — no build phase to clarify
