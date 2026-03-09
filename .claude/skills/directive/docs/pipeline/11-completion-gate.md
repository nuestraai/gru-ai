<!-- Pipeline doc: 11-completion-gate.md | Rewritten -->

## Completion: CEO Completion Gate

All directives -- including lightweight -- require CEO sign-off before status becomes `completed`.

### Status Transitions

```
active -> awaiting_completion -> completed
                                 -> reopened -> active (new projects added)
```

### Present to CEO

Include enough information for the CEO to decide without digging into files:

1. **Files changed:** `git diff --stat main..directive/$ARGUMENTS`
2. **Test results:** pass/fail counts, any failures with explanations
3. **Review summary:** key findings from reviewers, DOD verification outcomes
4. **Task outcomes:** any `failed` or `partial` tasks with reasons
5. **Digest highlights:** the 3-5 most important points from the report

Then ask:
```
Directive {name} is ready for completion review.

- Approve: Mark as completed. All work is satisfactory.
- Reopen: Provide feedback on what's missing. The COO will plan new projects.
```

### Approve Flow

When CEO approves:

1. Update `.context/directives/{id}/directive.json`:
   - `status` -> `"completed"`
   - `completed` -> today's date (`YYYY-MM-DD`)
   - `current_step` -> `"completion"`
   - `pipeline.completion.status` -> `"completed"`
   - `updated_at` -> current ISO timestamp
2. Update each project.json: set `status` to `"completed"` if all tasks completed
3. Log: `[COMPLETED] Directive {name} approved by CEO`

### Reopen Flow

When CEO reopens with feedback:

1. Update directive.json:
   - `status` -> `"reopened"`
   - Increment `revision` counter
   - Add entry to `iterations[]` with `opened_at` and CEO feedback
   - `updated_at` -> current ISO timestamp
2. Restart pipeline from plan step for new projects only (existing completed projects untouched)
3. Log: `[REOPENED] Directive {name} -- CEO feedback: {summary}`

### Non-Interactive Sessions

When running as a CLI session:
- Write digest to `.context/reports/`
- Set status to `awaiting_completion`
- CEO reviews via subsequent session or dashboard
- Directive is not done until CEO explicitly approves
