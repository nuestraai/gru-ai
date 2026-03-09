## Checkpoint: Resume from Prior Progress

Pipeline sessions die from context limits, timeouts, or cancellations. Without checkpoints, all completed work would need to re-run. This step detects prior progress and offers to resume.

### Check for Progress

Read `.context/directives/$ARGUMENTS/directive.json`. If it exists and has a `current_step` field, prior progress exists.

**If no progress found:** Proceed to the read step.

**If progress found:** Present a resume summary:

```
Found progress for {id}:
- Started: {started_at}, last updated: {updated_at}
- Progress: {completed}/{total} tasks complete
- Current step: {current_step}
- Tasks: {list each with status}

Resume or restart fresh?
```

Ask the CEO: **Resume** or **Restart**.

### Resume Routing

| current_step | Resume Action |
|-------------|---------------|
| plan or audit | Load `planning.coo_plan`, skip to approve |
| approve | Re-present plan for CEO approval |
| project-brainstorm or setup | Load worktree path, verify state, skip to execute |
| execute or review-gate | Load tasks, skip completed/skipped, restart in_progress from first phase |
| wrapup or completion | Continue from first incomplete wrapup sub-step |

When restarting an in_progress task, read its artifact files for context but re-execute all phases from scratch. Partial phase resume is not reliable -- only truly completed tasks are skipped.

### Restart

Remove pipeline/execution fields from directive.json (keep metadata). Delete project artifacts (`rm -rf .context/directives/{id}/projects/`). Proceed to the read step.

> See [directive-json.md](../reference/schemas/directive-json.md) for the full schema.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md).
