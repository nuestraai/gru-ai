#!/usr/bin/env bash
# validate-reviews.sh — Post-execution enforcement (review-gate hard gate)
#
# Called after all tasks execute and before wrapup/finalization.
# Blocks completion if any completed task with reviewers has no review evidence.
#
# Usage: echo '{"directive_dir":".context/directives/my-dir","project_id":"my-project"}' | ./validate-reviews.sh
#
# Checks project.json for completed tasks and verifies that:
# 1. Project has reviewers assigned (existing check)
# 2. Review artifact files exist: review-{task-id}.md in the project directory
# 3. Task agent != project reviewers (catches self-review)
# 4. Self-certification heuristic (all DOD met with no review artifact)
#
# Exit 0, JSON output = validation result (valid: true/false, violations: [...])

set -euo pipefail

cd "$(git rev-parse --show-toplevel)" || { echo "Error: not in a git repo" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || { echo "Error: jq is required" >&2; exit 1; }

INPUT=$(cat)

DIRECTIVE_DIR=$(echo "$INPUT" | jq -r '.directive_dir // empty')
PROJECT_ID=$(echo "$INPUT" | jq -r '.project_id // empty')
DIRECTIVE_NAME=$(echo "$INPUT" | jq -r '.directive_name // .id // empty')

if [[ -n "$DIRECTIVE_DIR" && -n "$PROJECT_ID" ]]; then
  PROJECT_PATH="${DIRECTIVE_DIR}/projects/${PROJECT_ID}/project.json"
elif [[ -n "$DIRECTIVE_DIR" && -n "$DIRECTIVE_NAME" ]]; then
  PROJECT_PATH="${DIRECTIVE_DIR}/projects/${DIRECTIVE_NAME}/project.json"
else
  echo '{"valid": false, "violations": ["Pass JSON with directive_dir+project_id fields."]}'
  exit 0
fi

if [[ ! -f "$PROJECT_PATH" ]]; then
  echo '{"valid": false, "violations": ["project.json not found at '"${PROJECT_PATH}"'"]}'
  exit 0
fi

# Derive project directory from project.json path
PROJECT_DIR=$(dirname "$PROJECT_PATH")

violations=()

# Get project-level reviewers as newline-separated list (bash 3.2 safe — no associative arrays)
PROJECT_REVIEWERS_COUNT=$(jq -r '.reviewers | length' "$PROJECT_PATH" 2>/dev/null || echo "0")
PROJECT_REVIEWERS_LIST=$(jq -r '.reviewers[]?' "$PROJECT_PATH" 2>/dev/null || echo "")

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

    # --- Check 1: Project has reviewers assigned ---
    if [[ "$PROJECT_REVIEWERS_COUNT" -eq 0 ]]; then
      violations+=("Task '${TASK_ID}' is completed with review phase but has NO reviewers assigned")
    fi

    # --- Check 2: Review artifact file exists ---
    # 09-execute-projects.md specifies: review-{task-id}.md or build-{task-id}.md
    REVIEW_ARTIFACT="${PROJECT_DIR}/review-${TASK_ID}.md"
    BUILD_ARTIFACT="${PROJECT_DIR}/build-${TASK_ID}.md"
    if [[ ! -f "$REVIEW_ARTIFACT" && ! -f "$BUILD_ARTIFACT" ]]; then
      violations+=("Task '${TASK_ID}' has no review artifact (expected review-${TASK_ID}.md or build-${TASK_ID}.md in ${PROJECT_DIR})")
    fi

    # --- Check 3: Self-review detection (task agent == project reviewer) ---
    # Get the task-level agent (could be a string or array)
    TASK_AGENT=$(jq -r ".tasks[$i].agent | if type == \"array\" then .[0] else . end // empty" "$PROJECT_PATH" 2>/dev/null)

    if [[ -n "$TASK_AGENT" && -n "$PROJECT_REVIEWERS_LIST" ]]; then
      # Check if the task agent appears in the project reviewers list
      SELF_REVIEW="false"
      while IFS= read -r reviewer; do
        if [[ -n "$reviewer" && "$reviewer" = "$TASK_AGENT" ]]; then
          SELF_REVIEW="true"
          break
        fi
      done <<EOF
$PROJECT_REVIEWERS_LIST
EOF
      if [[ "$SELF_REVIEW" = "true" ]]; then
        # Self-review: task builder is also a reviewer — only flag if they are the ONLY reviewer
        if [[ "$PROJECT_REVIEWERS_COUNT" -eq 1 ]]; then
          violations+=("Task '${TASK_ID}' builder ('${TASK_AGENT}') is the only project reviewer — self-review detected")
        fi
      fi
    fi

    # --- Check 4: Self-certification heuristic ---
    # All DOD met + no review artifact = likely self-certified
    DOD_COUNT=$(jq ".tasks[$i].dod | length" "$PROJECT_PATH" 2>/dev/null || echo "0")
    DOD_MET=$(jq "[.tasks[$i].dod[] | select(.met == true)] | length" "$PROJECT_PATH" 2>/dev/null || echo "0")

    if [[ "$DOD_COUNT" -gt 0 && "$DOD_MET" -eq "$DOD_COUNT" && ! -f "$REVIEW_ARTIFACT" ]]; then
      violations+=("Task '${TASK_ID}' has ALL DOD criteria met but no review artifact — possible self-certification")
    fi

    # Check for VISUAL GATE criteria that require browser verification
    VISUAL_GATES=$(jq -r "[.tasks[$i].dod[] | select(.criterion | test(\"VISUAL GATE|browser screenshot|verified by human\"; \"i\")) | select(.met == true)] | length" "$PROJECT_PATH" 2>/dev/null || echo "0")

    if [[ "$VISUAL_GATES" -gt 0 ]]; then
      # Visual gate criteria marked as met — this requires human/browser verification
      # Just warn, don't block (the orchestrator may have done visual verification)
      : # no-op for now, could add warning
    fi
  fi
done

if [[ ${#violations[@]} -eq 0 ]]; then
  echo '{"valid": true, "violations": []}'
else
  echo "{\"valid\": false, \"violations\": $(printf '%s\n' "${violations[@]}" | jq -R . | jq -s .)}"
fi
