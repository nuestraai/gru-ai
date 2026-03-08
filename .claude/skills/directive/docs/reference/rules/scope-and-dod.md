<!-- Reference: scope-and-dod.md | Source: SKILL.md restructure -->

# Scope Format, Definition of Done, and User Scenario Rules

## User Scenario Rules

- Every task must include a `user_scenario` — one sentence describing the user experience after this ships
- Good: "The CEO runs /directive and sees a telemetry summary with token costs and wall times at the end of the digest"
- Bad: "Improves the system" (too vague — what does the user actually experience?)
- Reviewers walk this scenario during review to verify the work delivers the promised experience

## Scope Format

Write 2-4 sentences describing what needs to happen. Focus on the outcome and approach, not specific files or line numbers. Example: "All API endpoints that accept user input need input validation and parameterized queries. Currently using string interpolation for SQL. Switch to Prisma parameterized queries and add Zod validation schemas."

## Definition of Done Rules

- Each task must include 3-5 specific, testable acceptance criteria in `definition_of_done`
- These are what the reviewer will verify — concrete conditions, not vague outcomes
- Good DOD: "Every /api/* route has a Zod schema and type-check passes"
- Bad DOD: "Security is improved" (too vague to verify)
- DOD should cover: functional correctness, scope completeness, and CEO-intent alignment
- If the directive has explicit success criteria, each criterion should map to at least one DOD item

Also from the first DOD block in the COO's prompt:
- Every task MUST have a definition_of_done array with 2-5 concrete, testable criteria
- Each criterion must be verifiable (not vague like "improve quality")
- DOD is what the CEO reviews to approve/reject the task's result
- Examples of good DOD: "All directive.json files have required fields", "Watcher reads directive.json and populates state fields", "Type-check passes"
- Examples of bad DOD: "Improve goal structure", "Make it work", "Better code quality"

## UI/Visual Definition of Done Rules

These rules extend the general DOD rules above for tasks touching UI or visual
code (*.tsx, *.jsx, *.css, components/, pages/). Backend/data/infra tasks are
not affected.

1. **Describe what the user sees, not the implementation technique.**
   DOD must state the visible outcome, not the code path that produces it.
   - BAD: "Component renders without errors"
   - GOOD: "Settings panel shows all 5 configuration categories at default
     100% zoom without requiring horizontal scroll"

2. **Include default-state conditions.** Every UI DOD criterion must specify
   the conditions under which it holds: default zoom (100%), default view
   (initial load, no filters), representative data (not empty, not extreme).
   - BAD: "Labels use ctx.fillText"
   - GOOD: "Name labels visible above every character at default zoom level
     without requiring Ctrl+scroll"

3. **No implementation-only language.** Terms like "component renders",
   "state updates correctly", "uses ctx.fillText", or "hook fires" describe
   code behavior, not user-visible results. Rewrite as what the user
   observes: "panel displays", "count updates within 1 second", "name
   appears above the sprite".
