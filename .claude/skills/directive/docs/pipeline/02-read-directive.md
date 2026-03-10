<!-- Pipeline doc: 02-read-directive.md | Source: SKILL.md restructure -->

## Step 1: Read the Directive

**If a directive file exists:** Read `.context/directives/$ARGUMENTS/directive.md` (or `.context/directives/$ARGUMENTS.md` for legacy flat files).

**If no directive file exists (ad-hoc request):** The CEO gave an ad-hoc description instead of a directive name. Generate a kebab-case ID from the description (e.g., "run these 3 projects" → `run-3-projects`, "comprehensive system review" → `system-review-2026-03-04`). Create a directive directory `mkdir -p .context/directives/{id}/` with both `directive.md` and `directive.json`. The `.md` should contain the CEO's original request as the directive brief.

**If $ARGUMENTS looks like a project path** (contains `/`): Read the project.json at `.context/directives/{directive}/projects/{project}/project.json`. Generate a directive ID from the project name. Create the directive files.

**Naming convention:** Directive filenames must be kebab-case (e.g., `improve-security.md`). The name is used in git branch names (`directive/$ARGUMENTS`) and file paths.

### Create directive.json (ALWAYS — for all directive types including ad-hoc)

Create `.context/directives/$ARGUMENTS/directive.json` if it doesn't already exist (create the directory first: `mkdir -p .context/directives/$ARGUMENTS/`). This companion JSON provides structured metadata for the pipeline and dashboard.

> See [docs/reference/schemas/directive-json.md](../reference/schemas/directive-json.md) for the full directive.json schema.

```json
{
  "id": "$ARGUMENTS",
  "title": "{extracted from first heading of the .md}",
  "status": "in_progress",
  "created": "{today's date YYYY-MM-DD}",
  "completed": null,
  "weight": "{classification from triage: lightweight | medium | heavyweight | strategic}",
  "produced_features": [],
  "report": null,
  "backlog_sources": [],
  "dod": {
    "success_looks_like": [],
    "failure_looks_like": [],
    "quality_bar": "",
    "examples": []
  }
}
```

### Extract directive-level DOD from the CEO brief

After creating directive.json, scan the CEO brief (directive.md) and extract a best-effort definition of done into `directive.json.dod`. This is the CEO's intent translated into structured acceptance criteria.

**How to extract each field:**

1. **success_looks_like** -- Look for phrases describing desired outcomes, goals, or "I want X to happen." Convert each into a concrete, verifiable statement. One array entry per distinct outcome.
2. **failure_looks_like** -- Look for complaints about the current state, phrases like "the problem is...", "this doesn't work because...", or "stop doing X." Invert these into failure conditions. If the brief says "agents ignore the brainstorm output", the failure condition is "Builder output diverges from brainstorm without documented rationale."
3. **quality_bar** -- Synthesize the brief's overall standard into one sentence. If the brief mentions specific metrics, thresholds, or comparisons ("better than X", "zero regressions", "passes on first review"), use those. If no explicit bar exists, leave empty -- the clarification step will ask.
4. **examples** -- Extract any before/after scenarios, reference implementations, or concrete illustrations the CEO provides. Format as "Before: ... / After: ..." strings. If the brief has none, leave the array empty.

**Important:** This extraction is best-effort. The clarification step will present the extracted DOD back to the CEO for verification. Do not block on incomplete extraction -- empty fields are acceptable at this stage.

### Update directive.json

Set `current_step: "context"` (the next step). Update `pipeline.read.status` to `"completed"` with output summary including the directive title, weight, and DOD extraction status.

