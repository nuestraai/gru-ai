# Update gruai Framework Files

Update the gruai framework files (skills, pipeline docs, templates) to the latest version. This replaces the old `gruai update` CLI command.

## What This Does

1. Backs up existing `.claude/skills/` to `.gruai-backup/{timestamp}/`
2. Copies latest skill files from the gruai package
3. Re-renders `CLAUDE.md` with the latest template (preserving your agent names)

## What It Does NOT Overwrite

- `.context/` — your data (vision, directives, reports, lessons)
- `.claude/agent-registry.json` — your team names and config
- `.claude/agents/*.md` — your personality files
- `gruai.config.json` — your project configuration

## Instructions

### Step 1: Verify This Is a gruai Project

Check that at least one of these exists:
- `.claude/agent-registry.json`
- `CLAUDE.md`
- `gruai.config.json`

If none exist, tell the user to run `/gruai-agents` first.

### Step 2: Create Backup

Create a backup directory at `.gruai-backup/{YYYY-MM-DDTHH-MM-SS}/`.

Copy the existing `.claude/skills/` directory tree into the backup.
Copy the existing `CLAUDE.md` into the backup.

### Step 3: Update Skill Files

For each skill in the gruai package (`directive`, `scout`, `healthcheck`, `report`, `gruai-agents`, `gruai-config`):

1. Read the SKILL.md from the package source
2. Copy it to `.claude/skills/{skill}/SKILL.md` in the user's project
3. If the skill has a `docs/` subdirectory, copy that too (recursive)

The package source skills are at `.claude/skills/` relative to wherever gruai is installed.

### Step 4: Re-render CLAUDE.md

1. Read `.claude/agent-registry.json` to get the current agent names
2. Read the project name from `gruai.config.json` (field: `name`) or from the first heading in `CLAUDE.md`
3. Read `cli/templates/CLAUDE.md.template`
4. Replace `{{PROJECT_NAME}}` with the project name
5. Replace `{{AGENT_ROSTER}}` with a markdown table built from the registry agents
6. Write the result to `CLAUDE.md`

### Step 5: Report

Output a summary:
- How many skills were updated
- How many files were backed up
- The backup location
- What was preserved (not overwritten)
