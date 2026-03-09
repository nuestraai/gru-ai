# Pipeline Lean Redesign — Digest Report

**Date:** 2026-03-09
**Directive:** pipeline-lean-redesign
**Weight:** Strategic
**Branch:** `pipeline-lean-redesign` (worktree: `/tmp/pipeline-lean-redesign`)

## Summary

Aggressive rewrite of the directive pipeline docs to address context bloat and quality degradation. Driven by external research (context engineering, harness engineering) and internal gap analysis.

## Key Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total words | 15,847 | 8,966 | -43% |
| Largest file | 756 lines (09-execute-projects.md) | 146 lines (execute-loop.md) | -81% |
| Doc conflicts | 7 identified | 0 remaining | Fixed |
| Enforcement gates | 0 (all prose) | 5 (script-backed) | +5 |
| CC-specific references | Throughout | Abstracted | Framework-agnostic |

## What Changed

### Structural
- **09-execute-projects.md deleted** (756 lines) → split into 3 focused files: execute-loop.md (146), phase-catalog.md (110), agent-prompts.md (94)
- **checkpoint-protocol.md created** — consolidates status update instructions from 10+ scattered locations
- **SKILL.md rewritten** (214 lines) — WHY-based entry point with 3 examples by weight class, progressive disclosure routing table

### Conflicts Fixed (7)
1. Lightweight routing: triage said "spawn COO" but project-brainstorm said "no COO plan" → COO plans for all weights, lightweight auto-derives tasks
2. Brainstorm timing: some docs said "before planning", others "after" → before, consistently
3. Status lifecycle: `executing` vs `active` vs `in_progress` → `active` is the canonical pre-completion status
4. DOD verification: builder self-assessment vs reviewer verification → reviewer only
5. Code-review blocking: code-review failures were logged but didn't block → now blocks with max 1 fix cycle
6. Audit order: was after planning → now before, so COO gets codebase data upfront
7. project.json update location: buried at line 397 → prominent "State Checkpoint" section

### Enforcement Gates Added (5)
1. **State checkpoint** — mandatory project.json + directive.json updates after each task review
2. **Browser test** — `validate-browser-test.sh` blocks if `browser_test=true` but no `design-review.md`
3. **Code-review blocking** — `fail`/`critical` stops execution, triggers fix cycle
4. **DOD reviewer feedback** — orchestrator writes reviewer's `dod_verification` to project.json, not builder's
5. **Project completion** — `validate-project-completion.sh` blocks wrapup if tasks still pending

### Framework-Agnostic
- `agent-prompts.md` says "spawn via your runtime's agent mechanism" instead of CC-specific `Agent` tool syntax
- Phase catalog describes WHAT context to pass, not HOW to invoke CC APIs
- Role-based references (COO, CTO) with registry resolution — works for any agent framework

## CTO Review Findings

Review outcome: **pass** (after fixes)

**Blocking issues fixed:**
- F1: Brainstorm step linked to triage doc (re-execution hazard) → added section anchor
- F3: Browser-test gate accepted `visual-design.md` as review evidence → now requires `design-review.md` only
- F4: Lightweight skip table said approve/project-brainstorm skipped → they run as auto (approve creates project.json)

**Non-blocking issues fixed:**
- F5: `depends_on` contradiction between 05-planning.md and planner-prompt.md → reconciled
- F7: Status transition `executing → awaiting_completion` → corrected to `active → awaiting_completion`

**Strengths noted:**
- SKILL.md entry point is lean and well-routed
- Checkpoint protocol consolidation eliminates drift
- Execute-loop state checkpoint is clearly motivated
- Progressive disclosure works without circular reading

## Research Basis

External research (6 Anthropic + 2 OpenAI articles):
- Context rot: 15-30% performance degradation at 8K-16K instruction tokens
- Lost-in-the-middle effect: models attend to beginning/end, skip middle
- Harness engineering > context engineering: mechanical enforcement beats more docs
- Anthropic skill-creator quality criteria: <500 lines, WHY not MUST, 3-7 examples > 20 rules

## Stale Docs

25 historical reports/directives reference SKILL.md — expected since it was rewritten. These are snapshots; no updates needed. `gruai-config/SKILL.md` references directive skill by name — low risk.

## Follow-Up Candidates

| Item | Risk | Recommendation |
|------|------|----------------|
| `validate-reviews.sh` multi-project support (F8 from CTO review) | Medium | The script validates one project at a time — works for single-project but needs iteration for multi-project directives |
| Brainstorm as separate doc (CTO R1) | Low | Currently embedded in 00-delegation-and-triage.md — could be its own file for cleaner routing |
| Checkpoint protocol as validation script (CTO R2) | Low | Currently a doc — could become a script that mechanically verifies updates were made |
| Watcher `FULL_PIPELINE_STEPS` constant | Medium | Server watcher may need updating if step count changed (was 14, now 15 with checkpoint) |

## Lessons

- **Context rot is real**: After ~80K tokens (10+ tool calls), earlier instructions fade. Solution: don't repeat — consolidate into single-reference docs.
- **Harness engineering > more docs**: The pipeline had 0 enforcement scripts for gates. All rules were in prose. Agents skipped them silently. Adding 5 script-backed gates is worth more than 5,000 words of "MUST" instructions.
- **State checkpoint is the #1 failure mode**: In production, agents completed work but never wrote progress. Making the checkpoint instruction prominent (not buried at line 397) is a structural fix.
