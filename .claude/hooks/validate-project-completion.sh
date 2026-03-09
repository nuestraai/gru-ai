#!/bin/bash
# validate-project-completion.sh
# Gate: if execute step completed, project.json tasks should not be "pending"
# Usage: echo '{"directive_dir":"path"}' | ./validate-project-completion.sh

set -euo pipefail
INPUT=$(cat)
DIRECTIVE_DIR=$(echo "$INPUT" | jq -r '.directive_dir')

if [ -z "$DIRECTIVE_DIR" ] || [ "$DIRECTIVE_DIR" = "null" ]; then
  echo '{"valid": false, "error": "directive_dir is required"}'
  exit 1
fi

# Find all project.json files
found_any=false
for pj in "$DIRECTIVE_DIR"/projects/*/project.json; do
  [ -f "$pj" ] || continue
  found_any=true
  project_name=$(basename "$(dirname "$pj")")
  # Validate JSON is parseable before querying
  if ! jq empty "$pj" 2>/dev/null; then
    echo "{\"valid\": false, \"error\": \"Corrupt JSON in $project_name/project.json\"}"
    exit 1
  fi
  pending=$(jq '[.tasks[] | select(.status == "pending" or .status == null)] | length' "$pj" 2>/dev/null || echo "0")
  total=$(jq '.tasks | length' "$pj" 2>/dev/null || echo "0")
  if [ "$pending" -gt 0 ]; then
    echo "{\"valid\": false, \"error\": \"$pending of $total tasks still pending in $project_name/project.json\"}"
    exit 1
  fi
done

if [ "$found_any" = false ]; then
  echo '{"valid": false, "error": "No project.json files found in directive projects/"}'
  exit 1
fi

echo '{"valid": true}'
exit 0
