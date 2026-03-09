# Checkpoint Protocol

The dashboard reads `directive.json` every second via WebSocket. Without updates, the CEO sees "last updated 3 days ago" even though work is in progress. Checkpoints exist to keep the CEO informed and to enable resume after context exhaustion.

## After Every Pipeline Step

1. Set `pipeline.{stepId}.status` to `"completed"`
2. Include `output.summary` (1-2 sentences -- the dashboard renders this directly)
3. Include `agent` (who performed this step)
4. Set `current_step` to the next step's ID
5. Set `updated_at` to current ISO timestamp
6. Write directive.json

When starting a step, set `pipeline.{stepId}.status` to `"active"`.

## During Execute Step

After each task completes review:

1. Update `pipeline.execute.output.progress` = `"X of Y tasks complete"`
2. Set `updated_at` to now
3. Write directive.json

After each task's review completes:

1. Set task `status` to `"completed"` in project.json
2. Update DOD `met` fields from reviewer verification
3. Set project `updated` timestamp
4. Write project.json

## Context Exhaustion

If you are running low on context, complete the current step's directive.json update before stopping. The checkpoint system resumes from the last completed step — an incomplete checkpoint means the step reruns from scratch. Prioritize writing `pipeline.{stepId}.status = "completed"` and `current_step` to the next step ID. This is more important than finishing in-progress work that can be re-derived.

## Example: Step Completion Update

```json
{
  "pipeline": {
    "plan": {
      "status": "completed",
      "agent": "COO",
      "output": {
        "summary": "2 projects planned: auth-refactor (P0, 3 tasks) and api-docs (P1, 2 tasks).",
        "projects": ["auth-refactor", "api-docs"]
      },
      "artifacts": [".context/directives/my-directive/plan.json"]
    }
  },
  "current_step": "audit",
  "updated_at": "2026-03-09T10:30:00Z"
}
```

## Example: Execute Progress Update

```json
{
  "pipeline": {
    "execute": {
      "status": "active",
      "agent": "frontend-engineer",
      "output": {
        "summary": "Building auth-refactor project.",
        "progress": "2 of 5 tasks complete"
      }
    }
  },
  "current_step": "execute",
  "updated_at": "2026-03-09T11:45:00Z"
}
```
