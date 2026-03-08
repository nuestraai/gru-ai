# Sam QA Engineer Memory

## Bash 3.2 Compatibility (macOS default)
- macOS ships bash 3.2 which does NOT support `declare -A` (associative arrays)
- Empty arrays `arr=()` combined with `set -u` crash on `"${arr[@]}"` reference
- Workaround: use indexed variables (`eval "VAR_${i}=value"`) or newline-delimited strings
- `for _ in $(seq ...)` works but `for _ in {1..N}` does not expand in bash 3.2
- `date +%s%3N` not supported on macOS; fallback to `$(( $(date +%s) * 1000 ))`
- All E2E test scripts must remain bash 3.2 compatible

## E2E Test Infrastructure
- Location: `tests/e2e/`
- Orchestrator: `run-e2e.sh` (--dim, --list, --help flags)
- Shared lib: `lib/utils.sh` (assertions, timing, port, temp dirs)
- Dimensions: `dim-init.sh`, `dim-server.sh`, `dim-schema.sh`, `dim-multiplatform.sh`, `dim-benchmark.sh`
- Results: `tests/e2e/results/dim-{name}.json` + `summary.json`
- CLI invocation: uses `node $GRUAI_CLI` directly (not `npx gru-ai`) to avoid npm cache serving stale v0.1.0
- CLI must be rebuilt (`npm run build:cli`) before tests if source changes

## npx Cache Gotcha
- `npx gru-ai` can serve a stale cached version from npm registry
- Local dev must use `node dist-cli/index.js` directly for testing
- Always verify with `--version` when debugging unexpected behavior

## Project References
- project.json at: `.context/directives/e2e-comprehensive-testing/projects/e2e-orchestrator-and-deterministic-dims/project.json`
