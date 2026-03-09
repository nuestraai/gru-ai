## Setup: Branch Isolation + State Verification

Branch isolation keeps directive changes separate from main so the CEO can review a clean diff. This matters because multiple directives may be in flight, and mixing changes makes review impossible.

### Create Branch

Default is branch-only (no worktree):

```bash
git checkout -b directive/$ARGUMENTS
```

Use a worktree only when `git status` shows uncommitted changes that should be preserved:

```bash
git worktree add ../sw-directive-$ARGUMENTS -b directive/$ARGUMENTS
```

If the worktree already exists, reuse it. All agent spawn prompts must include `"Working directory: {worktree_path}"` so agents operate in the isolated copy.

**Skip isolation if:** the user explicitly says "no branch", or all task phases are research-only (no code changes).

### Verify Directive State

Before execution begins, confirm directive.json has consistent state:

| Field | Expected Value |
|-------|---------------|
| `pipeline.setup.status` | `"completed"` |
| `pipeline.execute.status` | `"active"` |
| `current_step` | `"execute"` |
| `projects[]` | All projects from COO's plan with `status: "pending"` |
| `updated_at` | Current timestamp |

directive.json is the single source of truth for both checkpoint/resume and dashboard display. There is no separate state file.

### Artifact Writes

After each phase completes during execution, write phase output (design doc, build report, review JSON) to the project directory: `.context/directives/{id}/projects/{project-id}/{phase}.md`. These survive context exhaustion and allow resumed runs to provide context to downstream phases.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "execute"`, `planning.worktree_path` to the path (or null if branch-only).
