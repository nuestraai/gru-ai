## Read: Load the Directive

This step reads the directive brief and creates the directive.json that the dashboard and checkpoint system depend on.

### Locate the Directive

| Input | Action |
|-------|--------|
| Directive name exists | Read `.context/directives/$ARGUMENTS/directive.md` |
| No directive file (ad-hoc request) | Generate a kebab-case ID from the description, create `directive.md` + `directive.json` in `.context/directives/{id}/` |
| Project path (contains `/`) | Read `project.json` at that path, generate directive ID from project name, create directive files |

**Naming convention:** Directive filenames are kebab-case (e.g., `improve-security`). The name is used in git branch names (`directive/$ARGUMENTS`) and file paths.

### Create directive.json

Create `.context/directives/$ARGUMENTS/directive.json` if it does not already exist. This file is what the dashboard reads and what the checkpoint system uses for resume. Without it, the directive is invisible.

```json
{
  "id": "$ARGUMENTS",
  "title": "{extracted from first heading of the .md}",
  "status": "in_progress",
  "created": "{today's date YYYY-MM-DD}",
  "completed": null,
  "weight": "{classification from triage}",
  "produced_features": [],
  "report": null,
  "backlog_sources": []
}
```

> See [directive-json.md](../reference/schemas/directive-json.md) for the full schema.

### Update directive.json

Update per the [checkpoint protocol](../reference/checkpoint-protocol.md). Set `current_step: "context"`.
