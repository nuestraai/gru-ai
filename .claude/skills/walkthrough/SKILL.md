---
name: "walkthrough"
description: "Cognitive walkthrough — simulate real user scenarios against the current system to find gaps between ideal and actual. Takes an optional scenario name or 'all' to run standing scenarios. Run after major directives or periodically as a reality check."
---

# Walkthrough — Cognitive Walkthrough

## Role Resolution

Read `.claude/agent-registry.json` to map roles to agent names. Use each agent's `id` as the `subagent_type` when spawning. The CPO designs the ideal experience; the CTO traces the actual implementation.

---

Simulate user scenarios against the current system. Find what's broken, missing, or surprising.

**The pattern:** For each scenario, design what SHOULD happen (ideal), trace what DOES happen (actual), report the gaps.

**Arguments:** `$ARGUMENTS`
- A specific scenario name (e.g., `ceo-runs-directive`) → run just that one
- `all` → run all standing scenarios
- A free-text scenario description (e.g., `"seller wants to see competitor prices"`) → ad-hoc walkthrough
- Empty → list available scenarios and ask which to run

## Step 1: Load Scenarios

### If $ARGUMENTS is a scenario name or "all":

Read standing scenarios from `.context/lessons/scenarios.md`.

Each scenario has:
- **Name**: slug identifier
- **Actor**: who is performing the action (CEO, seller, shopper, developer)
- **Trigger**: what starts the flow ("CEO types /directive improve-security")
- **Goal**: what the actor wants to achieve
- **Critical path**: the steps that MUST work for the scenario to succeed

If `all`, load all scenarios. If a specific name, load just that one.

### If $ARGUMENTS is free text:

Treat it as an ad-hoc scenario. Spawn the CPO to formalize it:

```
You are the CPO. The CEO described a user scenario informally:

"{$ARGUMENTS}"

Formalize it into this structure:
{
  "name": "slug-name",
  "actor": "who is doing this",
  "trigger": "what starts the flow",
  "goal": "what the actor wants to achieve",
  "critical_path": [
    "Step 1: what should happen first",
    "Step 2: what should happen next",
    ...
  ],
  "success_criteria": "how do you know the scenario succeeded"
}

Think from the ACTOR's perspective, not the system's. What does the actor expect at each step? What would surprise or frustrate them?

CRITICAL OUTPUT FORMAT: First character must be `{`, last must be `}`. JSON only.
```

### If $ARGUMENTS is empty:

Read `.context/lessons/scenarios.md` and list available scenarios:

```
Available scenarios:
1. ceo-runs-directive — CEO issues a directive, wants it handled without blocking
2. ceo-morning-review — CEO opens dashboard, wants to know what happened overnight
3. ...

Which scenario to walk through? (or describe a new one)
```

Use AskUserQuestion with the scenario names as options.

## Step 2: Design the Ideal (per scenario)

For each scenario, spawn the CPO to design the **ideal experience** — what SHOULD happen if everything worked perfectly.

The CPO receives:
- Their personality file
- The scenario definition
- `.context/vision.md` — so the ideal aligns with the north star
- `.context/preferences.md` — CEO expectations

```
You are the CPO. You are designing the IDEAL user experience for this scenario. Don't look at the current implementation — design from scratch what the perfect flow would be.

SCENARIO:
- Actor: {actor}
- Trigger: {trigger}
- Goal: {goal}

For each step of the critical path, describe:
1. What the actor does
2. What the system should do in response
3. What the actor sees/experiences
4. How long it should take (instant / seconds / minutes / async)
5. What would frustrate the actor at this step

Then describe the END STATE: what does "success" look like from the actor's perspective?

Think like a product designer, not an engineer. The actor doesn't care about checkpoints, worktrees, or JSON schemas. They care about: did the thing work? Was it fast? Did I have to babysit it?

CRITICAL OUTPUT FORMAT: First character must be `{`, last must be `}`. JSON only.

{
  "scenario": "{name}",
  "ideal_flow": [
    {
      "step": 1,
      "actor_action": "what the actor does",
      "system_response": "what should happen",
      "actor_experience": "what they see/feel",
      "timing": "instant | seconds | minutes | async",
      "frustration_risk": "what could annoy the actor here"
    }
  ],
  "end_state": "what success looks like",
  "key_expectations": ["the non-negotiable things the actor expects"]
}
```

## Step 3: Trace the Actual (per scenario)

For each scenario, spawn the CTO to trace what ACTUALLY happens in the current system. The CTO reads code, config, and skill files to follow the real execution path.

The CTO receives:
- Their personality file
- The scenario definition
- The CPO's ideal flow (from Step 2)
- `.context/lessons/` topic files — known issues
- `.context/preferences.md`

```
You are the CTO. You are tracing what ACTUALLY happens in the current system for this scenario. Read the real code and config — don't guess.

SCENARIO:
- Actor: {actor}
- Trigger: {trigger}
- Goal: {goal}
- Critical path: {steps}

IDEAL FLOW (from the CPO):
{CPO's ideal_flow JSON}

For each step of the ideal flow, trace what the current system actually does:
1. Read the relevant files (SKILL.md, agent files, code)
2. Follow the execution path step by step
3. Note where reality matches the ideal
4. Note where reality DIVERGES from the ideal
5. Note where the system does NOTHING (missing functionality)

Be thorough. Grep for entry points, read the actual instructions, trace the branching logic. Don't assume — verify.

### Doc Consistency Checks

After tracing the execution flow, check the pipeline's internal
documentation for consistency. These checks catch drift between docs
that causes real pipeline failures — fields referenced in one file but
undefined in another, prompt templates injecting stale field names,
validation scripts that don't enforce what the docs promise.

Run these three checks by reading actual file contents (use Grep and
Read). Do NOT guess from memory.

**A. Cross-reference verification.** For each pipeline step doc in
`.claude/skills/directive/docs/pipeline/`, check that any
directive.json or project.json field it references actually exists in
the corresponding schema doc under
`.claude/skills/directive/docs/reference/schemas/` (especially
`directive-json.md` and `plan-schema.md`). Example: if
`09-execute-projects.md` reads `directive.planning.coo_plan`, confirm
`directive-json.md` defines `planning.coo_plan`.

**B. Schema-to-template alignment.** For each prompt template in
`.claude/skills/directive/docs/reference/templates/`, check that the
fields it injects (placeholders like `{field_name}` or references to
JSON paths) match the schema definitions in
`.claude/skills/directive/docs/reference/schemas/`. Example: if
`planner-prompt.md` injects `{audit.risk_areas}`, confirm
`audit-output.md` defines `risk_areas`.

**C. Validation script coverage.** For each validation script in
`.claude/hooks/validate-*.sh`, check that the fields it validates
match what the pipeline docs and schemas claim are enforced. Example:
if `07-plan-approval.md` says "the gate validates `projects` array
exists", confirm `validate-gate.sh` actually checks for that field.
Also check the inverse — if a doc says a field is "required" or
"enforced", a validation script should check it.

Record every discrepancy. Omit checks that pass — only report
mismatches.

CRITICAL OUTPUT FORMAT: First character must be `{`, last must be `}`. JSON only.

{
  "scenario": "{name}",
  "actual_flow": [
    {
      "ideal_step": 1,
      "ideal_expectation": "what the CPO said should happen",
      "actual_behavior": "what the system actually does",
      "status": "match | diverge | missing | broken",
      "evidence": "file:line or config entry that proves this",
      "notes": "explanation of the gap, if any"
    }
  ],
  "gaps_found": [
    {
      "id": "gap-slug",
      "severity": "critical | major | minor | cosmetic",
      "type": "missing | broken | wrong | slow | confusing",
      "description": "what's wrong",
      "ideal": "what should happen",
      "actual": "what does happen",
      "evidence": "file:line",
      "suggested_fix": "how to close the gap"
    }
  ],
  "doc_consistency": {
    "cross_ref_issues": [
      {
        "source_file": "pipeline doc that references the field",
        "references": "the field or path referenced",
        "expected_in": "schema doc where it should be defined",
        "issue": "missing | renamed | wrong_path"
      }
    ],
    "schema_drift": [
      {
        "template_file": "prompt template that injects the field",
        "injects": "field name or path the template uses",
        "schema_file": "schema doc that should define it",
        "issue": "field missing from schema | field renamed | type mismatch"
      }
    ],
    "validation_gaps": [
      {
        "script": "validate-*.sh script name",
        "doc_claims": "what the pipeline doc says is enforced",
        "doc_source": "pipeline doc making the claim",
        "issue": "script does not check this | script checks stale field name"
      }
    ]
  },
  "working_well": ["things that match the ideal — acknowledge what's good"]
}
```

## Step 4: Synthesize Gaps

After all scenarios are traced, consolidate the findings:

1. **Deduplicate** — the same gap may appear in multiple scenarios
2. **Prioritize** — critical gaps that block the actor's goal come first
3. **Cross-reference** — gaps that appear in 2+ scenarios are systemic
4. **Classify effort** — quick fix (< 1 hour), medium (half day), large (1+ days)
5. **Consolidate doc_consistency** — merge `doc_consistency` findings across
   all scenario traces. Deduplicate cross_ref_issues, schema_drift, and
   validation_gaps that appear in multiple traces (same source_file +
   references pair, same template_file + injects pair, or same script +
   doc_claims pair). Flag any issue that appears in 3+ traces as systemic
   drift. Keep one canonical entry per unique issue with a `found_in`
   list of scenario names.

## Step 5: Present to CEO

```
# Walkthrough Report — {date}

## Scenarios Walked: {count}

### {Scenario Name}
**Actor**: {actor} | **Goal**: {goal}

**Ideal vs Actual:**
| Step | Ideal | Actual | Status |
|------|-------|--------|--------|
| 1 | {ideal} | {actual} | ✅ match / ⚠️ diverge / ❌ missing |
| 2 | ... | ... | ... |

**Gaps Found: {count}**
- [{severity}] **{description}** — {type}
  Ideal: {what should happen}
  Actual: {what does happen}
  Fix: {suggested fix} ({effort})

**Working Well:**
- {things that matched the ideal}

(repeat per scenario)

## Systemic Gaps (appear in 2+ scenarios)
- **{gap}** — found in: {scenario list}

(if doc_consistency findings exist across any scenario trace, include this section)

## Doc Consistency
Issues found by cross-checking pipeline docs, schemas, templates, and
validation scripts. These cause silent pipeline failures when docs drift
out of sync.

### Cross-Reference Mismatches
| Source File | References | Expected In | Issue |
|-------------|-----------|-------------|-------|
| {source_file} | {references} | {expected_in} | {issue} |

### Schema-Template Drift
| Template File | Injects | Schema File | Issue |
|---------------|---------|-------------|-------|
| {template_file} | {injects} | {schema_file} | {issue} |

### Validation Coverage Gaps
| Script | Doc Claims | Doc Source | Issue |
|--------|-----------|------------|-------|
| {script} | {doc_claims} | {doc_source} | {issue} |

(omit any subsection whose table would be empty)

## Summary
- Total gaps: {count} ({critical}, {major}, {minor})
- Scenarios fully passing: {count}/{total}
- Top 3 fixes by impact: {list}
```

Then ask the CEO:
- "Create directive from gaps" — bundle gaps into a directive in directives/
- "Add to backlog" — write gaps to the relevant goal's backlog
- "Note only" — just keep the report

## Step 6: Save Report

Write the full report to `.context/reports/walkthrough-{date}.md`

If gaps were approved as a directive, create it in `.context/directives/`.

## Standing Scenarios File

If `.context/lessons/scenarios.md` doesn't exist, create it with starter scenarios on first run. The CEO and team add scenarios over time as new flows become important.

## Failure Handling

| Situation | Action |
|-----------|--------|
| The CPO can't formalize ad-hoc scenario | Ask CEO to clarify the scenario |
| The CTO can't find the entry point for a step | Mark as "missing — no implementation found" |
| A scenario has no gaps | Report it as passing — this is good news |
| scenarios.md doesn't exist | Create it with starter scenarios, then run |

## Rules

### NEVER
- Skip the ideal design (Step 2) — the whole point is comparing ideal vs actual
- Have the same agent design ideal AND trace actual — separate perspectives prevent bias
- Mark a gap as "minor" if it blocks the actor's goal — that's critical by definition
- Trace the actual by reading docs/comments — read the real code/config

### ALWAYS
- Design ideal BEFORE tracing actual — don't let current state constrain the ideal
- Include evidence (file:line) for every gap — no hand-waving
- Acknowledge what's working well — not just gaps
- Save the report even if no gaps found (it's a health signal)
- Use the CPO for ideal (product thinking) and the CTO for actual (technical tracing)
