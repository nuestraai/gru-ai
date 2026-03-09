#!/usr/bin/env bash
# validate-reviews.sh — Post-execution enforcement (review-gate hard gate)
#
# Called after all tasks execute and before wrapup/finalization.
# Blocks completion if any completed task with reviewers has no review evidence.
#
# Usage: echo '{"directive_dir":".context/directives/my-dir"}' | ./validate-reviews.sh
#
# Iterates ALL projects under directive_dir/projects/*/project.json.
# Checks each completed task with a "review" phase for:
# 1. Project has reviewers assigned
# 2. Not all DOD criteria self-certified (all met with no review artifact = suspicious)
#
# Exit 0, JSON output = validation result (valid: true/false, violations: [...])

set -eo pipefail

cd "$(git rev-parse --show-toplevel)" || { echo "Error: not in a git repo" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || { echo "Error: jq is required" >&2; exit 1; }

INPUT=$(cat)

DIRECTIVE_DIR=$(echo "$INPUT" | jq -r '.directive_dir // empty')

if [[ -z "$DIRECTIVE_DIR" ]]; then
  echo '{"valid": false, "violations": ["Pass JSON with directive_dir field."]}'
  exit 0
fi

# Collect violations as newline-separated strings (bash 3.2 compatible)
VIOLATIONS=""
add_violation() {
  if [[ -z "$VIOLATIONS" ]]; then
    VIOLATIONS="$1"
  else
    VIOLATIONS="$VIOLATIONS
$1"
  fi
}

FOUND_PROJECTS=false

for PROJECT_PATH in "$DIRECTIVE_DIR"/projects/*/project.json; do
  [[ -f "$PROJECT_PATH" ]] || continue
  FOUND_PROJECTS=true

  # Validate JSON is parseable
  if ! jq empty "$PROJECT_PATH" 2>/dev/null; then
    add_violation "Corrupt JSON in $(basename "$(dirname "$PROJECT_PATH")")/project.json"
    continue
  fi

  PROJECT_NAME=$(basename "$(dirname "$PROJECT_PATH")")
  PROJECT_REVIEWERS=$(jq -r '.reviewers | length' "$PROJECT_PATH" 2>/dev/null || echo "0")
  TASK_COUNT=$(jq '.tasks | length' "$PROJECT_PATH" 2>/dev/null || echo "0")

  for i in $(seq 0 $((TASK_COUNT - 1))); do
    TASK_ID=$(jq -r ".tasks[$i].id // \"task-$i\"" "$PROJECT_PATH" 2>/dev/null)
    TASK_STATUS=$(jq -r ".tasks[$i].status // \"pending\"" "$PROJECT_PATH" 2>/dev/null)

    # Only check completed tasks
    if [[ "$TASK_STATUS" != "completed" ]]; then
      continue
    fi

    # Check if task has "review" in its phases
    HAS_REVIEW_PHASE=$(jq -r ".tasks[$i].phases | if . then (. | index(\"review\")) else null end" "$PROJECT_PATH" 2>/dev/null)

    if [[ "$HAS_REVIEW_PHASE" != "null" && "$HAS_REVIEW_PHASE" != "" ]]; then
      # Task has a review phase and is completed — verify project has reviewers
      if [[ "$PROJECT_REVIEWERS" -eq 0 ]]; then
        add_violation "[$PROJECT_NAME] Task '${TASK_ID}' is completed with review phase but has NO reviewers assigned"
      fi

      # Self-certification detection: all DOD met with no review artifact is suspicious
      DOD_COUNT=$(jq ".tasks[$i].dod | length" "$PROJECT_PATH" 2>/dev/null || echo "0")
      DOD_MET=$(jq "[.tasks[$i].dod[] | select(.met == true)] | length" "$PROJECT_PATH" 2>/dev/null || echo "0")

      if [[ "$DOD_COUNT" -gt 0 && "$DOD_MET" -eq "$DOD_COUNT" ]]; then
        # All DOD met — check if review artifact exists as evidence
        PROJECT_DIR=$(dirname "$PROJECT_PATH")
        if [[ ! -f "$PROJECT_DIR/review.md" && ! -f "$PROJECT_DIR/review-${TASK_ID}.md" ]]; then
          add_violation "[$PROJECT_NAME] Task '${TASK_ID}' has ALL DOD marked met but no review artifact found — possible self-certification"
        fi
      fi
    fi
  done
done

if [[ "$FOUND_PROJECTS" = false ]]; then
  echo '{"valid": false, "violations": ["No project.json files found under '"${DIRECTIVE_DIR}"'/projects/"]}'
  exit 0
fi

if [[ -z "$VIOLATIONS" ]]; then
  echo '{"valid": true, "violations": []}'
else
  echo "{\"valid\": false, \"violations\": $(echo "$VIOLATIONS" | jq -R . | jq -s .)}"
fi
