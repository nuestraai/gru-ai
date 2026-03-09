<!-- Pipeline doc: agent-prompts.md | Split from 09-execute-projects.md -->

## Agent Spawn Patterns

Reference doc for spawning agents during execution. Looked up per-spawn, not read end-to-end.

The pipeline is framework-agnostic. These patterns describe **what context** to give agents. The spawn mechanism depends on your runtime (Claude Code Agent tool, CLI sessions, custom frameworks, etc.).

### Agent Identity

Each agent has an entry in `.claude/agent-registry.json` with an `id`, personality `agentFile`, and domain expertise. Use the registry to resolve roles (e.g., "CTO" → the agent with `title: "CTO"`). Personality files define how agents communicate and reason — load them via your runtime's mechanism rather than pasting contents into prompts.

**Fallback assignments:**
- No specific builder assigned → full-stack engineer
- Unnamed auditor → CTO
- Unnamed reviewer → QA engineer

### Parallel Execution

Parallel builds require isolated agent processes so they don't interfere. Track child processes and clean them up if the orchestrator exits unexpectedly — without this, orphaned agents accumulate and saturate API rate limits.

```bash
# Example: process cleanup trap (adapt to your runtime)
CHILD_PIDS=()
cleanup_children() {
  for pid in "${CHILD_PIDS[@]}"; do kill "$pid" 2>/dev/null; done
}
trap cleanup_children EXIT
```

### Engineer/Builder Prompt

Include this context when spawning any builder:

1. **Task scope** (from project.json)
2. **Task definition_of_done** (from project.json) -- the builder needs acceptance criteria before building
3. **Audit findings**: active file list, baseline, dead code flags
4. **Recommended approach** (from audit `recommended_approach` field) -- implementation guidance, not a mandate. Builder can deviate but should explain why.
5. **Visual design spec** (if `visual-design.md` exists in the project directory)
6. **Brainstorm output** (if project had brainstorm -- see constraint below)
7. **Clarification Q&A** (if clarification phase preceded build)

**Required instructions to include in every builder prompt:**

- "After completing the build, report BOTH what you built AND what you think is still missing. Include a `proposed_improvements` section."
- "Walk through the feature as the CEO using it for the first time. Include a `user_walkthrough` section describing the step-by-step experience."
- "After completing each task, update project.json: set task status, DOD met fields, and updated timestamp. The dashboard tracks progress from this file."

### Brainstorm Constraint Prompt

Prepend this when the project had a brainstorm phase:

```
BRAINSTORM CONSTRAINT -- READ BEFORE WRITING ANY CODE:

The team brainstormed this task's approach before you were assigned:

{brainstorm output from the project's brainstorm.md}

Before writing any code, you must:
1. Read the brainstorm analysis above
2. In your build report, include a `brainstorm_alignment` section:
   - Which brainstorm recommendations you followed
   - Which you deviated from and WHY
   - What the brainstorm missed that you discovered

If your build report has no brainstorm_alignment section, the review will flag it.
```

### Context Loaded for All Agents

Every agent (builder, reviewer, C-suite) receives:
- Agent identity from registry (personality file loaded by your runtime)
- `.context/preferences.md` — CEO standing orders
- `.context/vision.md` guardrails section
- `.context/lessons/` topic files (role-specific):
  - Engineers: `agent-behavior.md` + `skill-design.md`
  - CTO: `agent-behavior.md` + `review-quality.md`
  - CPO: `review-quality.md`
  - COO: `orchestration.md` + `review-quality.md`
  - CMO: `agent-behavior.md`

### UX Verification (Mandatory for UI Work)

Triggered when audit `active_files` match UI patterns: `*.tsx`, `*.jsx`, `*.css`, `*.scss`, `*.html`, `tailwind.config.*`, `globals.css`, or files under `pages/`, `app/`, `components/`, `layouts/`, `styles/`.

The orchestrator verifies using browser automation (if available) or manual review:
1. Navigate to every modified page/component
2. Click every clickable element — verify no dead-end UI
3. Check data matches backend
4. Test the "CEO workflow": open → see what happened → click into detail → know what to do
5. Take screenshots as evidence

If browser automation is unavailable, log UI checks needing manual verification in the digest.
