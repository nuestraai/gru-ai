<!-- Reference: scope-and-dod.md | Source: SKILL.md restructure -->

# Scope Format, Definition of Done, and User Scenario Rules

## User Scenario Rules

- Every task must include a `user_scenario` -- one sentence describing
  the user experience after this ships
- Good: "The CEO runs /directive and sees a telemetry summary with
  token costs and wall times at the end of the digest"
- Bad: "Improves the system" (too vague -- what does the user
  actually experience?)
- Reviewers walk this scenario during review to verify the work
  delivers the promised experience

## Scope Format

Write 2-4 sentences describing what needs to happen. Focus on the
outcome and approach, not specific files or line numbers. Example:
"All API endpoints that accept user input need input validation and
parameterized queries. Currently using string interpolation for SQL.
Switch to Prisma parameterized queries and add Zod validation
schemas."

## Definition of Done Rules

DOD criteria are **acceptance scenarios** -- they describe what the
CEO or end user observes when the work is complete, not what the code
does internally.

### The acceptance scenario rule

Every DOD item must answer: "What does the user see, do, or
experience that proves this works?" If a criterion can only be
verified by reading source code, it belongs in a code comment or test
assertion, not in DOD.

- **Good DOD:** "CEO opens the directive digest and sees token cost
  and wall-clock time for each pipeline step"
- **Bad DOD:** "Type-check passes" (verifies tooling, not user value)
- **Good DOD:** "Given a directive with 3 projects, the dashboard
  shows per-project progress bars that update as tasks complete"
- **Bad DOD:** "Zod schema exists for project status" (implementation
  detail, not observable outcome)

### Writing acceptance scenarios

Use given/when/then or equivalent phrasing. Each criterion should be
one scenario -- if you need "and" or "also", split into two criteria.

Format: **Given** [a specific starting state], **when** [the user
takes an action], **then** [an observable outcome occurs].

Keep each criterion to 1-2 sentences. The reviewer must be able to
walk the scenario without reading the code.

### Full workflow examples

**Example 1 -- Pipeline clarification step:**

Directive DOD (`success_looks_like`):
> "CEO verifies extracted intent piece by piece before planning begins"

Project DOD:
> "Clarification step presents each intent field individually for CEO
> confirmation"

Task-level acceptance scenarios:
1. Given a directive with an ambiguous brief ("improve the dashboard"),
   when the pipeline reaches the clarification step, the CEO sees each
   extracted intent field (success_looks_like, failure_looks_like,
   quality_bar) presented individually and can modify any field before
   planning begins.
2. Given a directive whose brief contains explicit success criteria
   ("zero regressions, passes on first review"), when the read step
   extracts DOD fields, the clarification step shows the extracted
   fields pre-populated -- the CEO confirms or edits, not
   re-types from scratch.
3. Given a directive where the brief is too vague to extract any DOD
   fields, when clarification runs, the CEO sees empty fields with
   prompts asking "What does success look like?" rather than the
   pipeline silently proceeding with no DOD.

**Example 2 -- Review-gate with iteration:**

Directive DOD (`success_looks_like`):
> "When review finds bugs, the builder fixes them and re-review
> happens automatically"

Project DOD:
> "Review-gate enforces fix-and-resubmit cycle with convergence check"

Task-level acceptance scenarios:
1. Given a completed task whose code review returns "fail" with 2
   specific issues, when the builder receives the review feedback, the
   builder produces a fix addressing both issues and the reviewer
   re-reviews without CEO intervention.
2. Given a review cycle where the same bug appears in two consecutive
   reviews (no convergence), when the third cycle begins, the pipeline
   escalates to the CTO instead of looping indefinitely.
3. Given a task that passes code review on first submission, when the
   review-gate runs, the task proceeds to completion without
   unnecessary re-review cycles.

### What makes bad DOD

These patterns signal DOD that will not catch real problems:

- **Tool output as DOD:** "Type-check passes", "Lint clean",
  "Tests pass" -- these are CI gates, not acceptance criteria. They
  run automatically; nobody needs to verify them in DOD.
- **Implementation as DOD:** "Uses Zod schema", "Calls the API
  endpoint", "State stored in Redux" -- describes HOW, not WHAT the
  user gets.
- **Vague outcome:** "Security is improved", "Performance is better",
  "Code quality increases" -- not testable without a baseline and
  metric.

### DOD count and coverage

- Each task: 2-5 acceptance scenarios in `definition_of_done`
- Each scenario must be independently verifiable by the reviewer
- If the directive has explicit `success_looks_like` items, the
  task-level DOD across all tasks must collectively cover every item
- DOD is what the CEO reviews to approve/reject -- write for the
  CEO's eyes, not the compiler's

## DOD Derivation Chain

Directive-level DOD sets the standard. Project DOD operationalizes it.
Task DOD makes it testable. Each level narrows scope but preserves
intent.

```
directive.json.dod.success_looks_like
  "Pipeline completes without CEO intervention after initial brief"
      |
      v
project.json.dod (project level)
  "All pipeline steps from triage through completion execute
   without manual CEO prompts except at approval gates"
      |
      v
project.json.tasks[].dod (task level)
  { "criterion": "Given a medium-weight directive, when the
    pipeline runs from triage through execute, each step
    auto-continues to the next without waiting for CEO input",
    "met": false }
```

### How the chain works

1. **Read step** extracts `dod.success_looks_like` and
   `dod.failure_looks_like` from the CEO brief into directive.json
2. **Clarification step** presents extracted fields to the CEO for
   verification -- CEO confirms, edits, or fills gaps
3. **Project-brainstorm step** receives the verified directive DOD.
   The CTO derives task-level acceptance scenarios that collectively
   cover every `success_looks_like` item
4. **Builder** receives task DOD as acceptance criteria to build
   against
5. **Reviewer** receives task DOD + directive DOD to verify both
   task completion and directive intent alignment

### Traceability rule

Every `success_looks_like` item in directive.json must map to at
least one task-level DOD criterion across the project's tasks. If a
directive success criterion has no corresponding task DOD, the
project-brainstorm step missed it -- add a task or expand an existing
task's DOD.

## UI/Visual Definition of Done Rules

These rules extend the acceptance scenario approach above for tasks
touching UI or visual code (*.tsx, *.jsx, *.css, components/,
pages/). Backend/data/infra tasks are not affected.

1. **Describe what the user sees, not the implementation technique.**
   DOD must state the visible outcome at a specific state.
   - BAD: "Component renders without errors"
   - GOOD: "Given the settings page at default zoom (100%), when
     the user opens the panel, all 5 configuration categories are
     visible without horizontal scrolling"

2. **Include default-state conditions.** Every UI acceptance scenario
   must specify the conditions: default zoom (100%), default view
   (initial load, no filters), representative data (not empty, not
   extreme).
   - BAD: "Labels use ctx.fillText"
   - GOOD: "Given the office view at default zoom with 4 agents
     present, when the user looks at the canvas, name labels are
     visible above every character without requiring scroll or zoom
     adjustments"

3. **No implementation-only language.** Terms like "component
   renders", "state updates correctly", "uses ctx.fillText", or
   "hook fires" describe code behavior, not user-visible results.
   Rewrite as what the user observes: "panel displays", "count
   updates within 1 second", "name appears above the sprite".
