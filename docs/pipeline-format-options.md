# Pipeline Section — Format Options

Compare all 4 options rendered on GitHub. Same content, different presentation.

---

## Option A: Current (Tables)

You say "add dark mode to the dashboard." Here's what happens next — 15 steps across 5 phases, adapted by complexity. Lightweight tasks skip brainstorming and auto-approve. Strategic tasks get the full process with CEO gates.

**INTAKE**

| Step | What Happens |
|------|-------------|
| **Triage** | Classifies your directive by weight: lightweight, medium, heavyweight, or strategic. A typo fix gets fast-tracked. Dark mode touches theming, components, and user preferences — classified **medium**. [Start simple, add complexity only when needed.](https://www.anthropic.com/research/building-effective-agents) |
| **Checkpoint** | Checks for prior progress. If a session died mid-execution, it reads `directive.json` and [resumes from the last completed step](https://www.anthropic.com/engineering/building-c-compiler) — no work is lost. |
| **Read** | Parses your directive brief, creates structured metadata, and extracts your Definition of Done. |

**ANALYSIS**

| Step | What Happens |
|------|-------------|
| **Context** | Loads lessons, design docs, and intel — [scoped to what this directive needs](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), not a 200K-token dump. |
| **Audit** | Two-agent sequential audit. A QA engineer scans the codebase (pure facts: which files, what state, what breaks). Then the CTO reads those findings and recommends approaches. For dark mode: identifies 14 component files using hardcoded colors, flags the theme provider as the integration point. |
| **Brainstorm** | *(Heavyweight/strategic only.)* C-suite agents independently propose approaches, then [deliberate and argue](https://www.anthropic.com/engineering/multi-agent-research-system). For medium directives like dark mode, this step is skipped — the audit already provides enough grounding. |

**PLANNING**

| Step | What Happens |
|------|-------------|
| **Clarification** | Synthesizes intent from the CEO brief, audit findings, and brainstorm (if any). Surfaces conflicts and gaps. For heavyweight directives, the CEO confirms before planning begins — catching misalignment here costs one interaction instead of a full reopen. |
| **Plan** | The COO decomposes the directive into projects, assigns agents and reviewers. Dark mode becomes one project: a frontend engineer builds, the CPO reviews. |
| **Approve** | CEO reviews the plan. Lightweight and medium auto-approve. [Human review at trust boundaries only](https://www.anthropic.com/engineering/building-c-compiler) — you gate the plan and the result, not every step in between. |

**EXECUTION**

| Step | What Happens |
|------|-------------|
| **Project Brainstorm** | The CTO and assigned builder break each project into concrete tasks with Definition of Done criteria. Dark mode gets 4 tasks: theme provider, component migration, toggle UI, persistence. |
| **Setup** | Creates a git branch to isolate changes. |
| **Execute** | Builders work through tasks in priority order. After each task: a [separate reviewer evaluates with fresh context](https://www.anthropic.com/research/building-effective-agents) — no builder reasoning, no confirmation bias. Failed review triggers a fix cycle before moving on. |

**VERIFICATION**

| Step | What Happens |
|------|-------------|
| **Review Gate** | Bash scripts — not LLMs — [mechanically verify](https://www.anthropic.com/engineering/building-c-compiler) that every task was reviewed by a different agent, every DOD criterion was evaluated by the reviewer, and review artifacts exist. |
| **Wrapup** | Updates lessons and design docs. Generates a CEO digest with what changed, what was reviewed, and revert commands for anything risky. |
| **Completion** | CEO reviews the digest: approve, amend, or reopen. [All knowledge persists](https://arxiv.org/abs/2602.20478) in `.context/` — your next directive runs better because the team remembers what happened here. |

Hard gates: **Approve** (heavyweight/strategic only), **Review Gate** (all weights), **Completion** (all weights).

---

## Option B: List Format

You say "add dark mode to the dashboard." Here's what happens next — 15 steps across 5 phases, adapted by complexity. Lightweight tasks skip brainstorming and auto-approve. Strategic tasks get the full process with CEO gates.

### Intake

**Triage** — Classifies your directive by weight: a typo fix gets fast-tracked, dark mode → **medium**. [Start simple, add complexity only when needed.](https://www.anthropic.com/research/building-effective-agents)

**Checkpoint** — Session crashed? Reads `directive.json` and [resumes from the last completed step](https://www.anthropic.com/engineering/building-c-compiler) — no work is lost.

**Read** — Parses your directive brief, creates structured metadata, and extracts your Definition of Done.

### Analysis

**Context** — Loads lessons, design docs, and intel — [scoped to what this directive needs](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), not a 200K-token dump.

**Audit** — Two-agent sequential audit. QA engineer scans the codebase (pure facts), then the CTO recommends approaches. For dark mode: identifies 14 component files using hardcoded colors, flags the theme provider as the integration point.

**Brainstorm** — *(Heavyweight/strategic only.)* C-suite agents independently propose approaches, then [deliberate and argue](https://www.anthropic.com/engineering/multi-agent-research-system). Skipped for medium directives like dark mode.

### Planning

**Clarification** — Synthesizes intent from CEO brief, audit, and brainstorm. Surfaces conflicts and gaps. For heavyweight directives, the CEO confirms before planning — catching misalignment here costs one interaction instead of a full reopen.

**Plan** — COO decomposes the directive into projects, assigns agents and reviewers. Dark mode → one project: frontend engineer builds, CPO reviews.

**Approve** — CEO reviews the plan. Lightweight and medium auto-approve. [Human review at trust boundaries only](https://www.anthropic.com/engineering/building-c-compiler) — you gate the plan and the result, not every step in between.

### Execution

**Project Brainstorm** — CTO and assigned builder break each project into concrete tasks with Definition of Done criteria. Dark mode gets 4 tasks: theme provider, component migration, toggle UI, persistence.

**Setup** — Creates a git branch to isolate changes.

**Execute** — Builders work through tasks in priority order. After each task: a [separate reviewer evaluates with fresh context](https://www.anthropic.com/research/building-effective-agents) — no builder reasoning, no confirmation bias. Failed review triggers a fix cycle.

### Verification

**Review Gate** — Bash scripts — not LLMs — [mechanically verify](https://www.anthropic.com/engineering/building-c-compiler) that every task was reviewed by a different agent, every DOD criterion was evaluated, and review artifacts exist.

**Wrapup** — Updates lessons and design docs. Generates a CEO digest with what changed, what was reviewed, and revert commands for anything risky.

**Completion** — CEO reviews the digest: approve, amend, or reopen. [All knowledge persists](https://arxiv.org/abs/2602.20478) in `.context/` — your next directive runs better because the team remembers what happened here.

> Hard gates: **Approve** (heavyweight/strategic only), **Review Gate** (all weights), **Completion** (all weights).

---

## Option C: Compact Tables + Detail Below

You say "add dark mode to the dashboard." Here's what happens next — 15 steps across 5 phases, adapted by complexity. Lightweight tasks skip brainstorming and auto-approve. Strategic tasks get the full process with CEO gates.

### Intake

| Step | Summary |
|------|---------|
| **Triage** | Classifies weight — dark mode → **medium** |
| **Checkpoint** | Resumes from crash if prior progress exists |
| **Read** | Parses brief, extracts Definition of Done |

Triage [adapts the pipeline by complexity](https://www.anthropic.com/research/building-effective-agents): a typo fix skips brainstorm and auto-approves. A strategic rewrite gets the full process with CEO gates. Checkpoint reads `directive.json` so [state survives session death](https://www.anthropic.com/engineering/building-c-compiler).

### Analysis

| Step | Summary |
|------|---------|
| **Context** | Loads lessons, design docs, intel — scoped per role |
| **Audit** | QA scans codebase → CTO recommends approaches |
| **Brainstorm** | C-suite propose, deliberate, argue *(strategic only)* |

Each agent gets [fresh, minimal context](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — not a 200K-token dump. The audit is two-agent sequential: QA gathers pure facts (which files, what state, what breaks), then the CTO reads those findings and recommends. For dark mode: 14 component files with hardcoded colors, theme provider flagged as integration point. Brainstorm is skipped for medium — the audit provides enough grounding. For strategic directives, C-suite agents [outperform single-agent by 90.2%](https://www.anthropic.com/engineering/multi-agent-research-system).

### Planning

| Step | Summary |
|------|---------|
| **Clarification** | Synthesizes intent, surfaces conflicts and gaps |
| **Plan** | COO assigns projects, agents, reviewers |
| **Approve** | CEO reviews plan *(auto for lightweight/medium)* |

Clarification catches misalignment early — one interaction instead of a full reopen. The COO decomposes dark mode into one project: frontend engineer builds, CPO reviews. [Human review at trust boundaries only](https://www.anthropic.com/engineering/building-c-compiler) — you gate the plan and the result, not every step in between.

### Execution

| Step | Summary |
|------|---------|
| **Project Brainstorm** | CTO + builder decompose tasks with DOD |
| **Setup** | Creates isolated git branch |
| **Execute** | Build → review → fix cycle per task |

Dark mode gets 4 tasks: theme provider, component migration, toggle UI, persistence. After each task, a [separate reviewer evaluates with fresh context](https://www.anthropic.com/research/building-effective-agents) — no builder reasoning, no confirmation bias. Failed review triggers a fix cycle before moving on.

### Verification

| Step | Summary |
|------|---------|
| **Review Gate** | Mechanical verification — no self-review, all DOD checked |
| **Wrapup** | Lessons, digest, revert commands |
| **Completion** | CEO approves, amends, or reopens |

Bash scripts — not LLMs — [mechanically verify](https://www.anthropic.com/engineering/building-c-compiler) every review. Wrapup generates a CEO digest. [All knowledge persists](https://arxiv.org/abs/2602.20478) — your next directive runs better because the team remembers.

> Hard gates: **Approve** (heavyweight/strategic only), **Review Gate** (all weights), **Completion** (all weights).

---

## Option D: Flow Diagram + List Details

You say "add dark mode to the dashboard." Here's what happens next — 15 steps across 5 phases, adapted by complexity.

```
 INTAKE          ANALYSIS         PLANNING         EXECUTION        VERIFICATION
┌──────────┐   ┌──────────┐    ┌──────────┐    ┌──────────────┐   ┌──────────────┐
│ Triage   │   │ Context  │    │ Clarify  │    │ Project      │   │ Review Gate  │
│ Check    │──▶│ Audit    │──▶ │ Plan     │──▶ │   Brainstorm │──▶│ Wrapup       │
│ Read     │   │ Brain-   │    │ Approve ◆│    │ Setup        │   │ Completion ◆ │
│          │   │   storm  │    │          │    │ Execute      │   │              │
└──────────┘   └──────────┘    └──────────┘    └──────────────┘   └──────────────┘

◆ = CEO gate (heavyweight/strategic: Approve + Completion | all weights: Review Gate + Completion)
```

Lightweight tasks skip brainstorm and auto-approve. Strategic tasks get the full process.

### Intake

**Triage** — Classifies weight: a typo fix gets fast-tracked, dark mode → **medium**. [Start simple, add complexity only when needed.](https://www.anthropic.com/research/building-effective-agents)

**Checkpoint** — Session crashed? Reads `directive.json` and [resumes from the last completed step](https://www.anthropic.com/engineering/building-c-compiler) — no work is lost.

**Read** — Parses your directive brief, creates structured metadata, and extracts your Definition of Done.

### Analysis

**Context** — Loads lessons, design docs, and intel — [scoped to what this directive needs](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), not a 200K-token dump.

**Audit** — Two-agent sequential audit. QA engineer scans the codebase (pure facts), then the CTO recommends approaches. For dark mode: identifies 14 component files using hardcoded colors, flags the theme provider as the integration point.

**Brainstorm** — *(Heavyweight/strategic only.)* C-suite agents independently propose approaches, then [deliberate and argue](https://www.anthropic.com/engineering/multi-agent-research-system). Skipped for medium directives like dark mode.

### Planning

**Clarification** — Synthesizes intent from CEO brief, audit, and brainstorm. Surfaces conflicts and gaps. For heavyweight directives, the CEO confirms before planning — catching misalignment here costs one interaction instead of a full reopen.

**Plan** — COO decomposes the directive into projects, assigns agents and reviewers. Dark mode → one project: frontend engineer builds, CPO reviews.

**Approve** — CEO reviews the plan. Lightweight and medium auto-approve. [Human review at trust boundaries only](https://www.anthropic.com/engineering/building-c-compiler) — you gate the plan and the result, not every step in between.

### Execution

**Project Brainstorm** — CTO and assigned builder break each project into concrete tasks with Definition of Done criteria. Dark mode gets 4 tasks: theme provider, component migration, toggle UI, persistence.

**Setup** — Creates a git branch to isolate changes.

**Execute** — Builders work through tasks in priority order. After each task: a [separate reviewer evaluates with fresh context](https://www.anthropic.com/research/building-effective-agents) — no builder reasoning, no confirmation bias. Failed review triggers a fix cycle.

### Verification

**Review Gate** — Bash scripts — not LLMs — [mechanically verify](https://www.anthropic.com/engineering/building-c-compiler) that every task was reviewed by a different agent, every DOD criterion was evaluated, and review artifacts exist.

**Wrapup** — Updates lessons and design docs. Generates a CEO digest with what changed, what was reviewed, and revert commands for anything risky.

**Completion** — CEO reviews the digest: approve, amend, or reopen. [All knowledge persists](https://arxiv.org/abs/2602.20478) in `.context/` — your next directive runs better because the team remembers what happened here.

> Hard gates: **Approve** (heavyweight/strategic only), **Review Gate** (all weights), **Completion** (all weights).
