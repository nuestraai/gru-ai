<!-- Reference: casting-rules.md | Source: SKILL.md restructure -->

# Casting Rules

## Delegation Principle

C-suite agents (CTO, CPO, COO, CMO) focus on STRATEGY -- planning, auditing, challenging, and cross-cutting reviews. Specialists (frontend engineer, backend engineer, data engineer, content builder, QA engineer, full-stack engineer, UI/UX designer) handle EXECUTION -- building AND routine domain-specific reviews. Do NOT have C-suite do work that a specialist can handle. The orchestrator (directive session) delegates but does NOT build, review, or audit.

## Auditing

- Security/architecture audits → the CTO
- User-facing/product audits → the CPO or CTO
- Growth/marketing audits → the CMO
- Routine codebase audits for simple tasks → specialists can audit their own domain (frontend engineer audits frontend, backend engineer audits backend, data engineer audits data pipelines)

## Reviewing

- Simple frontend work → the frontend engineer reviews (not the CTO, unless security-sensitive)
- Simple backend work → the backend engineer reviews (not the CTO, unless architecture-sensitive)
- Simple data/pipeline work → the data engineer reviews
- QA/testing/validation → the QA engineer reviews
- UI design and visual quality → the UI/UX designer reviews (design review for any UI-touching task)
- Cross-cutting or architecture-sensitive work → the CTO reviews
- User-facing product/UX decisions → the CPO reviews
- Process/pipeline/operational changes → the COO reviews
- Growth/SEO/content quality → the CMO reviews
- Complex or risky work → C-suite reviewer + specialist reviewer (dual review)

## General

- Simple work (1-2 phases) → specialist builder + specialist reviewer (same domain, different person if possible; same person OK if solo domain)
- Moderate work (3-4 phases) → specialist builder + C-suite reviewer (for strategic oversight)
- Complex work (5+ phases) → full team: C-suite designs/audits, specialist builds, C-suite + specialist review
- Every project MUST have an auditor — this is who scans the codebase in the audit step
- Match reviewers to the domain being changed -- don't default to the CTO for everything
- Never have the builder review their own build (conflict of interest)
- Never have an agent review changes to its own behavior/prompts (conflict of interest)

## Specialist Builder Assignment (file-pattern matching)

When the audit reveals which files an task will touch, assign the matching specialist:
- Files in `src/components/`, `*.tsx`, `*.jsx`, or UI/styling work → the frontend engineer
- Files in `server/`, API routes, WebSocket, watchers, or backend logic → the backend engineer
- Files in `scripts/`, `server/parsers/`, `server/state/`, data pipelines, or indexing → the data engineer
- Files in `.context/`, `*.md`, `*.mdx`, documentation, or content creation → the content builder
- Testing, verification, type-checking, or QA-focused work → the QA engineer
- When scope crosses domains, use the DOMINANT domain's specialist
- When no clear domain match or scope is very broad → the full-stack engineer
- The full-stack engineer handles cross-domain work that doesn't clearly belong to a single specialist

## Reviewer-Type Definitions

When casting reviewers, each type focuses on their domain:

### C-Suite reviewers (strategic/cross-cutting -- use for complex, risky, or multi-domain work):
- **CTO (architecture/security)**: Code patterns, type safety, security vulnerabilities, performance, schema correctness, dependency risks. Use when work is security-sensitive, touches data models, or crosses system boundaries.
- **CPO (product/UX)**: User workflow completeness, product spec alignment, dead-end UI, first-impression clarity, CEO-intent match. Use when work affects what the CEO sees or touches.
- **COO (operations/process)**: Conductor process compliance, operational correctness, sequencing logic, casting rule adherence, checkpoint integrity. Use when work changes how the pipeline operates.
- **CMO (growth/content)**: SEO preservation, content quality, keyword targeting, internal linking, growth metric impact. Use when work affects public content or growth metrics.

### Specialist reviewers (domain-specific -- use for routine, single-domain work):
- **Frontend engineer**: Component patterns, Tailwind conventions, state management, UI consistency, responsive behavior, accessibility. Use for routine frontend builds.
- **UI/UX designer**: Layout fidelity, visual consistency, usability, responsiveness, polish. Use as design reviewer on any UI-touching task. During planning, collaborates with the CTO to produce design prototypes. **Pre-build role:** For UI tasks, Quinn produces the visual-design spec BEFORE the builder starts coding (visual-design phase).
- **Backend engineer**: API patterns, error handling, WebSocket correctness, watcher logic, server performance. Use for routine backend builds.
- **Data engineer**: Parser correctness, indexer logic, state file integrity, data pipeline accuracy. Use for data/pipeline builds.
- **QA engineer**: Type safety, build validation, test coverage, verification completeness, regression risk. Use as a second reviewer on any build for quality assurance.

## Multi-Reviewer Casting Guidance

- Simple frontend work → the frontend engineer reviews (CTO only if security-sensitive)
- Simple backend work → the backend engineer reviews (CTO only if architecture-sensitive)
- Simple data work → the data engineer reviews
- UI-touching tasks that affect CEO workflow → UI/UX designer produces visual-design (pre-build) + frontend engineer builds + UI/UX designer design-reviews + CPO reviews
- Complex/risky work → specialist builds + C-suite reviews (dual layer)
- Process/conductor changes → the COO reviews (owns the pipeline)
- Content/SEO work → the CMO reviews + the content builder builds
- Any task → optionally add the QA engineer as second reviewer for QA coverage
- Default: single specialist reviewer is fine for simple, single-domain work. Escalate to C-suite reviewer when the work is risky, cross-cutting, or user-facing.
