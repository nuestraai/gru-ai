# Initialize gruai Agent Team

Scaffold a complete AI agent team into the current project. This replaces the old `gruai init` CLI command.

## What This Does

1. Generates 11 agents with random names across standard roles
2. Creates `.claude/agents/*.md` personality files from role templates
3. Creates `.claude/agent-registry.json` (team config — the game reads this)
4. Scaffolds `.context/` tree (vision, lessons, directives, reports, backlog)
5. Creates `CLAUDE.md` project instructions with agent roster
6. Creates `gruai.config.json` project config

## Instructions

### Step 1: Generate Agent Names

Generate 11 unique random first names from a diverse pool. Pair each with a random last name. Assign to these roles in order:

| # | Role ID | Title | Role | C-Suite | Reports To | Domains |
|---|---------|-------|------|---------|------------|---------|
| 1 | cto | CTO | Chief Technology Officer | yes | ceo | Architecture, Security, Code Quality, Tech Intelligence |
| 2 | coo | COO | Chief Operating Officer | yes | ceo | Planning, Casting, Sequencing, Ecosystem Intelligence |
| 3 | cpo | CPO | Chief Product Officer | yes | ceo | Product Strategy, UX, Prioritization, Market Intelligence |
| 4 | cmo | CMO | Chief Marketing Officer | yes | ceo | Growth, SEO, Positioning, Growth Intelligence |
| 5 | frontend | FE | Frontend Developer | no | cto | React, Tailwind, Components, UI |
| 6 | backend | BE | Backend Developer | no | cto | Server, API, Database, Infra |
| 7 | fullstack | FS | Full-Stack Engineer | no | cto | Full-Stack, Cross-Domain |
| 8 | data | DE | Data Engineer | no | cto | Pipelines, Indexing, State, Parsers |
| 9 | qa | QA | QA Engineer | no | cto | Testing, Validation, QA, Edge Cases |
| 10 | design | UX | UI/UX Designer | no | cpo | UI Design, UX, Wireframes, Visual Review |
| 11 | content | CB | Content Builder | no | cmo | MDX, Copywriting, SEO Content, Docs |

The agent ID is the first name lowercased (e.g., "aria"). The agent file is `{firstname-lowercase}-{roleid}.md` (e.g., `aria-cto.md`).

For `reportsTo`, resolve the role ID to the generated agent's ID. E.g., if the CTO agent is named "Aria", then agents reporting to "cto" should have `reportsTo: "aria"`.

### Step 2: Create Personality Files

For each agent, read the role template from `cli/templates/agent-roles/{roleid}.md`. Replace these placeholders:
- `{{NAME}}` → full name (e.g., "Aria Chen")
- `{{FIRST_NAME}}` → first name (e.g., "Aria")
- `{{FIRST_NAME_LOWER}}` → lowercase first name (e.g., "aria")

Write the rendered file to `.claude/agents/{firstname-lowercase}-{roleid}.md`.

### Step 3: Create agent-registry.json

Write `.claude/agent-registry.json` with this structure:

```json
{
  "agents": [
    {
      "id": "ceo",
      "name": "CEO",
      "title": "CEO",
      "role": "Chief Executive Officer",
      "description": "Sets direction, reviews proposals, approves work",
      "agentFile": null,
      "reportsTo": null,
      "domains": ["Strategy", "Direction", "Approval"],
      "color": "text-foreground",
      "bgColor": "bg-foreground/10",
      "borderColor": "border-foreground/30",
      "dotColor": "bg-foreground",
      "isCsuite": true
    },
    // ... each generated agent with their assigned colors (see color map below)
  ],
  "teams": [
    {
      "id": "engineering",
      "name": "Engineering",
      "description": "Architecture, backend, data, full-stack engineering",
      "leadAgentId": "{cto-agent-id}",
      "memberAgentIds": ["{cto-id}", "{backend-id}", "{data-id}", "{fullstack-id}"],
      "color": "text-violet-400", "bgColor": "bg-violet-500/10", "borderColor": "border-violet-500/30"
    },
    {
      "id": "product",
      "name": "Product",
      "description": "Frontend, UX, quality assurance",
      "leadAgentId": "{cpo-agent-id}",
      "memberAgentIds": ["{cpo-id}", "{frontend-id}", "{design-id}", "{qa-id}"],
      "color": "text-blue-400", "bgColor": "bg-blue-500/10", "borderColor": "border-blue-500/30"
    },
    {
      "id": "growth",
      "name": "Growth",
      "description": "Content, SEO, marketing, positioning",
      "leadAgentId": "{cmo-agent-id}",
      "memberAgentIds": ["{cmo-id}", "{content-id}"],
      "color": "text-amber-400", "bgColor": "bg-amber-500/10", "borderColor": "border-amber-500/30"
    },
    {
      "id": "operations",
      "name": "Operations",
      "description": "Planning, orchestration, execution",
      "leadAgentId": "{coo-agent-id}",
      "memberAgentIds": ["{coo-id}"],
      "color": "text-emerald-400", "bgColor": "bg-emerald-500/10", "borderColor": "border-emerald-500/30"
    }
  ]
}
```

**Color map by role:**

| Role | color | bgColor | borderColor | dotColor |
|------|-------|---------|-------------|----------|
| CTO | text-violet-400 | bg-violet-500/15 | border-violet-500/40 | bg-violet-500 |
| COO | text-emerald-400 | bg-emerald-500/15 | border-emerald-500/40 | bg-emerald-500 |
| CPO | text-blue-400 | bg-blue-500/15 | border-blue-500/40 | bg-blue-500 |
| CMO | text-amber-400 | bg-amber-500/15 | border-amber-500/40 | bg-amber-500 |
| FE | text-pink-400 | bg-pink-500/15 | border-pink-500/40 | bg-pink-500 |
| BE | text-teal-400 | bg-teal-500/15 | border-teal-500/40 | bg-teal-500 |
| FS | text-indigo-400 | bg-indigo-500/15 | border-indigo-500/40 | bg-indigo-500 |
| DE | text-cyan-400 | bg-cyan-500/15 | border-cyan-500/40 | bg-cyan-500 |
| QA | text-lime-400 | bg-lime-500/15 | border-lime-500/40 | bg-lime-500 |
| UX | text-rose-400 | bg-rose-500/15 | border-rose-500/40 | bg-rose-500 |
| CB | text-orange-400 | bg-orange-500/15 | border-orange-500/40 | bg-orange-500 |

### Step 4: Scaffold Context Tree

Create the `.context/` directory structure:

1. Read `cli/templates/vision.md` — replace `{{PROJECT_NAME}}` — write to `.context/vision.md`
2. Read `cli/templates/lessons.md` — replace `{{PROJECT_NAME}}` — write to `.context/lessons/index.md`
3. Create empty dirs with `.gitkeep`: `.context/directives/`, `.context/reports/`, `.context/intel/`
4. Create `.context/preferences.md` with a starter template
5. Read `cli/templates/backlog.json.template` — write to `.context/backlog.json`

### Step 5: Create CLAUDE.md

Read `cli/templates/CLAUDE.md.template`. Replace:
- `{{PROJECT_NAME}}` → user's project name (ask if not obvious from repo)
- `{{AGENT_ROSTER}}` → a markdown table of all agents: `| Name | Title | Role |`

Write to `CLAUDE.md` at project root.

### Step 6: Create gruai.config.json

Read `cli/templates/gruai.config.json.template`. Replace:
- `{{PROJECT_NAME}}` → project name
- `{{AGENTS_JSON}}` → JSON array of `[{ "id": "...", "name": "...", "role": "..." }]`

Write to `gruai.config.json` at project root.

### Step 7: Report

Output a summary of what was created, listing all agent names and their roles. Suggest next steps:
1. Edit `.context/vision.md` with your project vision
2. Set preferences in `.context/preferences.md`
3. Run `/directive my-first-task` to start working

## Important

- Always use the templates in `cli/templates/` — never generate template content from scratch
- If files already exist (e.g., re-running the skill), ask before overwriting
- The CEO entry in agent-registry.json is always static (id: "ceo", agentFile: null)
