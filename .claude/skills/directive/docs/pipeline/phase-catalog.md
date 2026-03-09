<!-- Pipeline doc: phase-catalog.md | Split from 09-execute-projects.md -->

## Phase Catalog

Each task has a `phases` array. Execute phases in order, writing artifacts to the project directory.

| Phase | Agent | Purpose | Artifact |
|-------|-------|---------|----------|
| research | CMO or CTO | Investigate and produce findings | research.md |
| product-spec | CPO | Product requirements + acceptance criteria | product-spec.md |
| design | CTO | Technical approach based on codebase | design.md |
| visual-design | UX Designer | Visual spec before builder writes code | visual-design.md |
| keyword-research | CMO | Keywords, search intent, competitor gaps | keyword-research.md |
| outline | CMO | Content outline with headings + keywords | outline.md |
| clarification | Engineer + designer | Pre-build Q&A, 3-5 clarifying questions | clarification.md |
| build | Engineer | Implement the task | build.md |
| draft | Engineer | Write content following outline | draft.md |
| seo-review | CMO | SEO quality review | seo-review.md |
| code-review | Cast reviewer | Fresh-eyes code review (no builder context) | code-review.md |
| review | Cast reviewer | DOD compliance + user perspective check | review.md |
| design-review | UX Designer | UI implementation vs design spec | design-review.md |
| tech-review | CTO | Code quality + architecture review | tech-review.md |
| product-review | CPO | Product spec compliance | product-review.md |

Artifacts are written to: `.context/directives/{directive-id}/projects/{project-id}/{artifact}`.

### Phase Selection Guide

Common patterns the COO uses when composing task phases:

- **Simple bug fix:** `[build, review]`
- **Feature with UI:** `[visual-design, build, code-review, review, design-review]`
- **Content creation:** `[keyword-research, outline, draft, seo-review, review]`
- **Complex feature:** `[clarification, build, code-review, review]`
- **Research task:** `[research]` (also writes report to `.context/reports/`)
- **Full pipeline feature:** `[product-spec, design, visual-design, clarification, build, code-review, review, design-review, product-review]`

Include `code-review` when the task touches integration points (data flows, state management, API boundaries) or has >3 DOD criteria. Skip for trivial fixes.

### Code-Review Prompt

See [code-review-prompt.md](../reference/templates/code-review-prompt.md) for the full prompt template. Builder gets NO design docs or scope — fresh-context only with diff + architect's recommended approach. Conflict of interest: skip the builder from the reviewer list for code-review (see [casting-rules.md](../reference/rules/casting-rules.md)).

### Review Prompt (DOD + User Perspective)

Every reviewer gets this prompt structure. User-perspective evaluation comes FIRST -- a build that passes code review but fails user scenario is a "fail".

The reviewer outputs structured JSON with these sections:
- `review_outcome`: pass / fail / critical
- `user_perspective`: workflow_improvement, missing_features, dead_ends, data_integrity
- `dod_verification`: each criterion with met/evidence
- `corrections_check`: Standing Corrections from preferences.md
- `default_state_check`: (UI tasks only) verified at default zoom/view/data
- `surfaces_checked`, `what_is_missing`, `regression_risks`

A "pass" requires: all DOD met, zero corrections violations, workflow_improvement is "yes" or "partial", no major code issues. A "fail" if: workflow_improvement is "no", any DOD unmet, or major code issues.

See [execute-loop.md](execute-loop.md) for what happens on fail/critical outcomes.
