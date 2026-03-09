<!-- Pipeline doc: 10-wrapup.md | Rewritten from 238-line original -->

## Wrapup

After all tasks complete and the review-gate passes, run these steps in order.

### Process Engineer Improvements

Collect `proposed_improvements` from all engineer build reports. These are ideas builders had while working -- features that should exist, edge cases not covered, UX gaps.

Risk-classify each improvement using the same follow-up tiers:

| Risk | Action |
|------|--------|
| Low | Note in digest. No action needed. |
| Medium | Note in digest with revert commands. Auto-execute if safe. |
| High | Create a follow-up directive in `.context/directives/{id}/`. |

Include all improvements in the digest regardless of risk level.

### Process Follow-Up Actions

Collect `follow_ups` from audit findings across all tasks.

| Risk | Action |
|------|--------|
| **Low** | Spawn engineer to batch-execute. Examples: dead code, unused imports, typos. |
| **Medium** | Spawn engineer to execute + capture revert commands (`git checkout {hash} -- {path}`). Examples: auth gaps, validation, refactors. |
| **High** | Create pending directive with `source_directive` for traceability. Examples: schema changes, new endpoints, auth flow changes. |

**Skip follow-ups if:** research-only directive, no follow-ups identified, or all tasks skipped/failed.

### Detect Stale Docs

```bash
.claude/hooks/detect-stale-docs.sh --from-diff main
# or for worktree: .claude/hooks/detect-stale-docs.sh --from-diff directive/$ARGUMENTS
```

Captures docs referencing modified files that weren't themselves updated. Output goes into the digest.

### Generate Digest

Runs last -- after follow-ups and stale doc detection.

Write to `.context/reports/$ARGUMENTS-{date}.md`. See [digest template](../reference/templates/digest.md).

After writing, update directive.json: set `report` to the report filename (without extension), update `produced_features` if needed.

### Update Lessons

Append to the appropriate `.context/lessons/` topic file if the directive produced unexpected patterns or failure modes. Read existing files first to avoid duplicates.

| Topic | File |
|-------|------|
| Agent behavior | `agent-behavior.md` |
| Orchestration | `orchestration.md` |
| State/dashboard | `state-management.md` |
| Review/quality | `review-quality.md` |
| Pipeline/skill | `skill-design.md` |

**Consolidation trigger:** Every 10th directive (count reports), consolidate lessons and update `## Learned Patterns` in agent personality files.

### Browser Test Enforcement

If any project.json has `browser_test: true`, verify UI review evidence exists before proceeding:
- `design-review.md` artifact in the project directory, OR
- Orchestrator screenshot + verification note in the digest

```bash
echo '{"directive_dir":"'"$DIRECTIVE_DIR"'"}' | .claude/hooks/validate-browser-test.sh
```

If neither exists, stop. Do not set status to `awaiting_completion`.
Log: `[BLOCKED] browser_test=true but no UI review artifact found for {project}`

This gate exists because UI bugs are invisible without visual verification -- code review alone cannot catch layout, spacing, or interaction issues.

### Validate Project Completion

Before marking the directive ready for CEO review, verify no tasks are stuck in pending:

```bash
echo '{"directive_dir":"'"$DIRECTIVE_DIR"'"}' | .claude/hooks/validate-project-completion.sh
```

If any tasks are still `pending`, the execute step did not complete properly. Fix before proceeding.

### Mark Directive Awaiting Completion

Update directive.json to signal the CEO completion gate:

```json
{
  "status": "awaiting_completion",
  "current_step": "wrapup",
  "report_summary": "{digest-filename}",
  "updated_at": "{ISO timestamp}",
  "pipeline": { "wrapup": { "status": "completed" } }
}
```

Do NOT set status to `completed` -- that happens in the [completion gate](11-completion-gate.md) after CEO approval.

**Failed tasks:** If any tasks have `failed` or `partial` status, include explanations in the digest. The CEO needs to see incomplete work before approving.

### Report to CEO

Show the CEO:
1. Digest summary (key points, not the full file)
2. `git diff --stat main..directive/$ARGUMENTS` (this directive's changes only)
3. Review findings needing attention
4. Tasks with `failed` or `partial` status and explanations
5. Recommended next steps
6. Branch name for review

**Next:** [Completion gate](11-completion-gate.md) for CEO sign-off.

### Failure Handling

> See [failure-handling.md](../reference/rules/failure-handling.md) for the full table.

| Situation | Action |
|-----------|--------|
| Agent fails mid-task | Skip remaining phases, log in digest |
| All tasks fail | Generate digest showing failures, recommend review |
| Context exhaustion | directive.json preserves state -- re-run to resume |
| Brainstorm disagreement | Present all approaches, let CEO pick |
