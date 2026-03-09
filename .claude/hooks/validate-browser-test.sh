#!/bin/bash
# validate-browser-test.sh
# Gate: if project.json has browser_test=true, require UI review artifact
# Usage: echo '{"directive_dir":"path"}' | ./validate-browser-test.sh

set -euo pipefail
INPUT=$(cat)
DIRECTIVE_DIR=$(echo "$INPUT" | jq -r '.directive_dir')

if [ -z "$DIRECTIVE_DIR" ] || [ "$DIRECTIVE_DIR" = "null" ]; then
  echo '{"valid": false, "error": "directive_dir is required"}'
  exit 1
fi

for pj in "$DIRECTIVE_DIR"/projects/*/project.json; do
  [ -f "$pj" ] || continue
  # Validate JSON is parseable
  if ! jq empty "$pj" 2>/dev/null; then
    echo "{\"valid\": false, \"error\": \"Corrupt JSON in $(basename "$(dirname "$pj")")/project.json\"}"
    exit 1
  fi
  browser_test=$(jq -r '.browser_test // false' "$pj" 2>/dev/null)
  if [ "$browser_test" = "true" ]; then
    project_dir=$(dirname "$pj")
    project_name=$(basename "$project_dir")
    if [ ! -f "$project_dir/design-review.md" ]; then
      echo "{\"valid\": false, \"error\": \"browser_test=true in $project_name but no design-review.md found. Create design-review.md with visual verification evidence.\"}"
      exit 1
    fi
  fi
done

echo '{"valid": true}'
exit 0
