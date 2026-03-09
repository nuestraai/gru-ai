---
name: "directive"
description: "Execute work through the directive pipeline -- evaluate, plan, cast agents, build, review, and report. Takes a directive name (matching .context/directives/), a project path, or an ad-hoc CEO request.\n\nTRIGGER: Use this skill whenever the user requests non-trivial work that goes beyond a one-liner fix. This includes: building features, running projects with project.json, executing multiple tasks, multi-file changes, or any work with defined DOD/reviewers. Route through this pipeline so reviews and verification steps fire. Do NOT spawn builder agents directly.\n\nFor heavyweight/strategic work, create a directive file in .context/directives/ first. For medium work with an existing project.json, pass the project path. For quick multi-step tasks, pass an ad-hoc description -- no directive file needed."
---

# Execute Directive

Execute the CEO directive: $ARGUMENTS

## Role Resolution

Read `.claude/agent-registry.json` to map roles to agent names. The pipeline uses role-based language; resolve to concrete agents using the registry.

| Role | Registry Title | Responsibility |
|------|---------------|----------------|
| COO | `"COO"` | Plans projects, orchestrates execution |
| CTO | `"CTO"` | Architecture, audits, reviews, technical decomposition |
| CPO | `"CPO"` | Product strategy, UX review |
| CMO | `"CMO"` | Growth, SEO, content strategy |
| Frontend Developer | `"FE"` | React, Tailwind, components |
| Backend Developer | `"BE"` | Server, API, infrastructure |
| Full-Stack Engineer | `"FS"` | Cross-domain work |
| Data Engineer | `"DE"` | Pipelines, parsers, indexing |
| Content Builder | `"CB"` | MDX, documentation, copywriting |
| QA Engineer | `"QA"` | Testing, investigation, validation |
| UI/UX Designer | `"UX"` | Design review, wireframes, visual quality |

Use each agent's `id` to spawn them via your runtime's agent mechanism. The registry is the single source of truth.

---

## Start with Triage

Start with triage because it determines how much process overhead is needed. A one-file bug fix should not go through C-suite challenges and CEO approval gates. Triage classifies the directive's weight, and the weight controls which steps run.

Read and execute [00-delegation-and-triage.md](docs/pipeline/00-delegation-and-triage.md) before anything else. Do not read source code or edit files until triage and planning are complete — the pipeline exists to prevent the "I know how to fix this, let me just do it" impulse that skips reviews and verification.

Classify the weight, output the triage block, then proceed to the next step. The COO plans for all weights -- even lightweight work gets a structured plan.

---

## Pipeline Progress Protocol

Every pipeline step must update `directive.json`. The dashboard reads this file via WebSocket, and the checkpoint system uses it for resume after context exhaustion. Without updates, progress is invisible and unrecoverable.

See [checkpoint-protocol.md](docs/reference/checkpoint-protocol.md) for the full protocol with examples.

**Quick reference -- after each step:**
1. `pipeline.{stepId}.status` = `"completed"` with `agent`, `output.summary`, `artifacts`
2. `current_step` = next step's ID
3. `updated_at` = current ISO timestamp
4. Write directive.json

---

## Step Execution Loop

After completing a step and updating directive.json, immediately read and execute the next step's doc from the routing table. The pipeline runs end-to-end in a single pass.

**STOP gates -- the only two points where you pause for the CEO:**

1. **`approve`** -- heavyweight/strategic only. Lightweight and medium auto-approve.
2. **`completion`** -- all weights. CEO approves the final result or reopens.

If a step is skipped for the current weight class (e.g., challenge for lightweight), advance past it.

---

## Pipeline Steps

| # | Step ID | Doc | Purpose | Depends On |
|---|---------|-----|---------|------------|
| 1 | triage | [00-delegation-and-triage.md](docs/pipeline/00-delegation-and-triage.md) | Classify weight, select process | -- |
| 2 | checkpoint | [01-checkpoint.md](docs/pipeline/01-checkpoint.md) | Resume if prior progress exists | -- |
| 3 | read | [02-read-directive.md](docs/pipeline/02-read-directive.md) | Read directive + create directive.json | triage |
| 4 | context | [03-read-context.md](docs/pipeline/03-read-context.md) | Read context files before planning | read |
| 5 | challenge | [04-challenge.md](docs/pipeline/04-challenge.md) | C-suite challenge (heavyweight only) | context |
| 6 | brainstorm | [00-delegation-and-triage.md](docs/pipeline/00-delegation-and-triage.md) § "Heavyweight Brainstorm" | Brainstorm (heavyweight/strategic only) | context |
| 7 | audit | [06-technical-audit.md](docs/pipeline/06-technical-audit.md) | Codebase audit -- feeds into planning | context |
| 8 | plan | [05-planning.md](docs/pipeline/05-planning.md) | COO planning (with audit data) | audit |
| 9 | approve | [07-plan-approval.md](docs/pipeline/07-plan-approval.md) | CEO approval (heavyweight/strategic only) | plan |
| 10 | project-brainstorm | [07b-project-brainstorm.md](docs/pipeline/07b-project-brainstorm.md) | CTO + builder decompose tasks + DOD | approve |
| 11 | setup | [08-worktree-and-state.md](docs/pipeline/08-worktree-and-state.md) | Branch/worktree isolation | project-brainstorm |
| 12 | execute | [execute-loop.md](docs/pipeline/execute-loop.md) | Execute tasks via waves | setup |
| 13 | review-gate | [execute-loop.md](docs/pipeline/execute-loop.md) | Review verification | execute |
| 14 | wrapup | [10-wrapup.md](docs/pipeline/10-wrapup.md) | Digest, lessons, report | review-gate |
| 15 | completion | [11-completion-gate.md](docs/pipeline/11-completion-gate.md) | CEO approval gate | wrapup |

### Steps Skipped by Weight

| Weight | Skipped Steps |
|--------|--------------|
| Lightweight | challenge, brainstorm |
| Medium | challenge, brainstorm |
| Heavyweight | (none) |
| Strategic | (none -- adds deliberation round in brainstorm) |

---

## Reference Docs

### Schemas

| Doc | Content |
|-----|---------|
| [plan-schema.md](docs/reference/schemas/plan-schema.md) | COO plan output JSON schema |
| [audit-output.md](docs/reference/schemas/audit-output.md) | Architect output JSON schema |
| [investigation-output.md](docs/reference/schemas/investigation-output.md) | QA Engineer investigation output schema |
| [checkpoint.md](docs/reference/schemas/checkpoint.md) | Checkpoint JSON schema |
| [directive-json.md](docs/reference/schemas/directive-json.md) | Directive JSON schema (dashboard source of truth) |
| [challenger-output.md](docs/reference/schemas/challenger-output.md) | Challenger output JSON schema |
| [brainstorm-output.md](docs/reference/schemas/brainstorm-output.md) | Brainstorm output JSON schema |

### Templates

| Doc | Content |
|-----|---------|
| [planner-prompt.md](docs/reference/templates/planner-prompt.md) | COO planning prompt |
| [investigator-prompt.md](docs/reference/templates/investigator-prompt.md) | QA Engineer investigation prompt |
| [architect-prompt.md](docs/reference/templates/architect-prompt.md) | Architect prompt (audit phase 2) |
| [auditor-prompt.md](docs/reference/templates/auditor-prompt.md) | Combined audit prompt (single-agent path) |
| [challenger-prompt.md](docs/reference/templates/challenger-prompt.md) | Challenger prompt |
| [brainstorm-prompt.md](docs/reference/templates/brainstorm-prompt.md) | Brainstorm prompt (Phase 1 + Phase 2) |
| [code-review-prompt.md](docs/reference/templates/code-review-prompt.md) | Code-review prompt (fresh-context, no builder bias) |
| [digest.md](docs/reference/templates/digest.md) | Digest report template |

### Rules

| Doc | Content |
|-----|---------|
| [casting-rules.md](docs/reference/rules/casting-rules.md) | Agent casting: delegation, auditing, reviewing |
| [phase-definitions.md](docs/reference/rules/phase-definitions.md) | Phase building blocks + common patterns |
| [scope-and-dod.md](docs/reference/rules/scope-and-dod.md) | Scope format + Definition of Done rules |
| [failure-handling.md](docs/reference/rules/failure-handling.md) | Failure handling table |
| [checkpoint-protocol.md](docs/reference/checkpoint-protocol.md) | Status update protocol + examples |

### Validation Scripts

| Script | Purpose |
|--------|---------|
| [validate-cast.sh](../../hooks/validate-cast.sh) | Casting validation: auditor present, builder != reviewer |
| [validate-project-json.sh](../../hooks/validate-project-json.sh) | Pre-execution gate: tasks, DOD, scope present |
| [validate-reviews.sh](../../hooks/validate-reviews.sh) | Review-gate: blocks if completed tasks lack review evidence |
| [validate-browser-test.sh](../../hooks/validate-browser-test.sh) | Wrapup gate: blocks if browser_test=true but no design-review.md |
| [validate-project-completion.sh](../../hooks/validate-project-completion.sh) | Wrapup gate: blocks if tasks still pending after execute |
| [detect-stale-docs.sh](../../hooks/detect-stale-docs.sh) | Post-directive: flags stale doc references |

---

## Examples

### Example 1: Lightweight Run

A directive to fix a typo in the dashboard header.

**Triage output:**
```
Directive: fix-header-typo
Classification: lightweight
Reasoning: Single file change, no risk, no user-facing behavior change.
Process: triage -> checkpoint -> read -> context -> audit -> plan -> project-brainstorm (auto) -> setup -> execute -> review-gate -> wrapup -> completion
```

**directive.json progression:**

| Step | current_step | pipeline.{step}.output.summary |
|------|-------------|-------------------------------|
| triage | checkpoint | "Lightweight: single-file typo fix." |
| checkpoint | read | "No prior progress found." |
| read | context | "Created directive.json for fix-header-typo." |
| context | audit | "Read vision.md, lessons/agent-behavior.md." |
| audit | plan | "1 active file: DashboardHeader.tsx. No risks." |
| plan | approve | "1 project, 1 task: fix typo in header component." |
| approve (auto) | project-brainstorm | "Auto-approved. project.json created." |
| project-brainstorm (auto) | setup | "Tasks derived from COO plan. 1 task, 1 DOD criterion." |
| setup | execute | "Branch directive/fix-header-typo created." |
| execute | review-gate | "Task completed. 1 of 1 DOD criteria met." |
| review-gate | wrapup | "Review passed. All DOD verified." |
| wrapup | completion | "Digest written to .context/reports/." |
| completion | (done) | "CEO approved. Directive completed." |

Skipped: challenge, brainstorm. Approve and project-brainstorm run as auto (no CEO gate, tasks derived from COO plan).

### Example 2: Medium Run

A directive to add WebSocket reconnection logic (frontend + server changes, but well-scoped).

**Triage output:**
```
Directive: websocket-reconnect
Classification: medium
Reasoning: Touches 2 systems (frontend hook + server), 6 files predicted, but within a single domain (WebSocket).
Process: triage -> checkpoint -> read -> context -> audit -> plan -> project-brainstorm -> setup -> execute -> review-gate -> wrapup -> completion
```

Differences from lightweight:
- Full context load (all lessons, all active directives)
- COO spawned with audit data for informed planning
- Project-brainstorm runs: CTO + builder decompose into tasks with DOD
- Skips: challenge (COO's inline challenge covers it)
- Auto-approves: no CEO gate before execution

### Example 3: Heavyweight Run with Brainstorm

A directive to redesign the authentication system.

**Triage output:**
```
Directive: auth-redesign
Classification: heavyweight
Reasoning: Crosses frontend + backend + database, touches auth (sensitive), 15+ files predicted, architectural decisions needed.
Process: Full pipeline including challenge, brainstorm, and CEO approval gate.
```

Key differences:
- C-suite challenge spawns (CTO for security, CPO for UX impact)
- Brainstorm phase: 2-3 C-suite agents propose approaches (Phase 1 only, no deliberation)
- Brainstorm synthesis written to `.context/directives/auth-redesign/brainstorm.md`
- Audit runs with full two-agent flow (QA investigation + architect recommendations)
- COO receives audit data + brainstorm synthesis for informed planning
- CEO approval gate: pipeline STOPs, writes plan-for-approval.md, waits for CEO
- After CEO approves: project-brainstorm decomposes tasks, then execution proceeds
