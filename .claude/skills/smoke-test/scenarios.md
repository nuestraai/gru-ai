# Pipeline Smoke Test Scenarios
<!-- Moved from .context/lessons/scenarios.md — these are pipeline-mechanical scenarios used by /smoke-test -->

## pipeline-smoke-test
- **Actor**: The conductor system (directive session + agents)
- **Trigger**: CEO invokes `/directive {name}` for a medium-weight directive
- **Goal**: Trace the full pipeline end-to-end: CEO brief flows through triage, audit, brainstorm (skipped for medium), clarification (auto-approved for medium), planning, approval, task decomposition, build, code-review, review, wrapup, and completion -- verifying intent preservation at each handoff.
- **Critical path**:
  1. Triage: directive.md is read, classified as medium, `directive.json` created with `weight: "medium"`, `current_step: "triage"`, `dod` extracted from brief
  2. Audit: auditor scans codebase, produces findings with `weight_recommendation`. If weight upgrade recommended, directive.json.weight updated
  3. Brainstorm + Clarification: both skipped for medium weight (brainstorm skipped, clarification auto-approved with logged intent)
  4. Plan: COO produces `plan.json` with projects referencing audit data. Plan is auto-approved (medium weight), project.json created in approve step with `agent`, `reviewers`, project-level fields
  5. Project-brainstorm: CTO decomposes each project into tasks with `user_scenario`, `scope`, `dod` per task. Task DOD derived from directive.json.dod.success_looks_like via derivation chain. project.json updated with full `tasks[]` array
  6. Execute: builder receives task scope + DOD + **CEO brief verbatim** + **verified intent verbatim** + audit's `recommended_approach` + preferences + vision. Code-review runs with fresh-context prompt. If fail, fix cycle triggers (max 3 with convergence detection). Standard review runs with DOD verification + user-perspective (max 2 fix cycles)
  7. Review-gate: `validate-reviews.sh` confirms every completed task has a reviewer artifact and DOD verification. If `valid: false`, missing reviews run before proceeding
  8. Wrapup + Completion: digest written to `.context/reports/`, directive.json set to `awaiting_completion`. Acceptance checklist built from directive DOD. CEO reviews and chooses: approve, amend, extend, or redirect
  9. State consistency check: directive.json `projects[].status` matches each project.json `status`. Every task has `dod[].met` set by reviewer, not builder. Digest path in `wrapup.digest_path` resolves to an existing file
- **Success criteria**: A medium directive completes all 15 pipeline steps (with brainstorm skipped, clarification auto-approved). directive.json pipeline entries show `completed` or `skipped` for every step. project.json tasks all have reviewer-verified DOD. The CEO's original brief is visible in the builder prompt and the digest summary.

## pipeline-smoke-test-heavyweight
- **Actor**: The conductor system (directive session + agents)
- **Trigger**: CEO invokes `/directive {name}` for a heavyweight or strategic directive
- **Goal**: Trace the full pipeline with ALL gates active: brainstorm with challenge, CEO clarification verification, CEO plan approval, multi-project execution, and completion gate with acceptance checklist.
- **Critical path**:
  1. Triage: classified as heavyweight/strategic, `directive.json` created with `dod` extracted from brief
  2. Audit: two-agent flow (QA investigation -> Architect recommendations) with `weight_recommendation`. Architect receives directive scope (NOT COO projects -- audit runs before plan)
  3. Brainstorm: C-suite agents receive audit findings, produce Phase 1 proposals with embedded challenge assessment, Phase 2 deliberation with CEO clarification. Written to `brainstorm.md`
  4. Clarification: **STOP GATE** -- synthesizes `verified_intent` (goal, constraints, quality_bar, acceptance_scenarios, out_of_scope) from directive.md + audit + brainstorm. Presents each field to CEO for piece-by-piece verification. Stores in `pipeline.clarification.output.verified_intent`
  5. Plan: COO receives verified_intent + audit + brainstorm, produces multi-project `plan.json`. Validated by `validate-cast.sh`
  6. Approve: **STOP GATE** -- CEO reviews plan, can approve/modify/reject. On approval, `project.json` created per project
  7. Project-brainstorm: CTO decomposes each project into tasks. `directive_dod_coverage` mapping ensures every `success_looks_like` item maps to at least one task DOD
  8. Execute: multi-project sequential by priority tier. Builder gets CEO brief + verified intent verbatim. Code-review (max 3 cycles) + standard review (max 2 cycles) per task
  9. Completion: **STOP GATE** -- acceptance checklist walks directive DOD as pass/fail with evidence. CEO chooses approve/amend/extend/redirect. Amend restarts from execute, extend from plan, redirect replans fully
- **Success criteria**: All 15 pipeline steps run (none skipped). Two STOP gates fire (clarification, approve). CEO verifies intent before planning and approves plan before execution. Acceptance checklist at completion maps every directive.dod.success_looks_like to pass/fail with evidence. Amend/extend/redirect paths correctly mutate directive.json (iterations[], revision++).
