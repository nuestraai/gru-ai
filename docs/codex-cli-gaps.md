# Codex CLI — Capability Gap Analysis

Comparison between Claude Code and Codex CLI for the SpawnAdapter abstraction layer.
Based on research from `.context/directives/multi-platform-support/projects/platform-research-and-adapter/research-report.md`.

## Feature Comparison

| Feature | Claude Code | Codex CLI | Gap Impact |
|---------|------------|-----------|------------|
| **Named agents** | `--agent <id>` loads `.claude/agents/<id>.md` with personality + tool config | No equivalent. Instructions via `codex.md` in project root (one file per directory) | **High** — parallel agent spawns in shared worktree would overwrite each other's `codex.md`. Mitigation: use git worktree isolation (one worktree per agent spawn). |
| **Subagents** | Supported via Agent tool. Parent spawns child agents with `CollabAgentSpawnBeginEvent` tracking | Supported (`CollabAgentSpawnBeginEvent` in JSONL) but no explicit parent→child identity linking like Claude Code's session dir nesting | **Medium** — monitoring can detect subagents but can't reliably build the parent→child tree. |
| **Session persistence** | `--no-session-persistence` flag. Sessions stored in `~/.claude/projects/<dir>/sessions/` | No equivalent flag. Sessions always stored in `~/.codex/sessions/` | **Low** — ephemeral sessions not critical for the spawn layer. Monitoring layer handles session discovery. |
| **Sandbox/permissions** | `--dangerously-skip-permissions` bypasses all permission prompts | Sandbox on by default. `approval_policy` in `SessionConfiguredEvent` controls level (suggest/auto-edit/full-auto) | **Medium** — no CLI flag to skip permissions. Must configure via `config.toml` before spawn. Wave-based execution may conflict with default sandbox restrictions. |
| **MCP support** | Full MCP client support, configured in `settings.json` | Full MCP client support, configured in `config.toml` | **None** — both support MCP. Config format differs (JSON vs TOML). |
| **Token tracking** | `costUSD`, `tokenUsage` fields in session JSONL | `usage` field in JSONL entries with `input_tokens`, `output_tokens` | **Low** — both expose token data, just different field names. Monitoring adapter handles the mapping. |
| **Model selection** | `--model <id>` CLI flag | Via `model_provider_id` in `config.toml`, not CLI flag | **Medium** — can't select model per-spawn via CLI args. Must write/modify `config.toml` before each spawn if model varies per agent. |
| **CLI spawn mode** | `-p` (print mode) for non-interactive | `-q` (quiet mode) for non-interactive | **None** — direct mapping. |
| **Session format** | JSONL (append-only) | JSONL (append-only, ~80% format overlap) | **None** — near-identical format. Monitoring adapter can share most parsing logic. |
| **Config injection** | `CLAUDE.md` in project root (auto-loaded) | `codex.md` in project root (auto-loaded) | **None** — direct mapping. Personality compiler handles the translation. |
| **Tool permissions** | Per-tool allow/deny in agent frontmatter + `settings.json` | `approval_policy` gates all tool access (no per-tool granularity) | **Medium** — can't replicate Claude Code's fine-grained tool control. All tools are either approved or sandboxed. |

## Critical Gaps for Wave-Based Execution

### 1. codex.md Collision (High Impact)

Codex reads `codex.md` from the project root. In wave-based parallel execution, multiple agents spawn in the same working directory simultaneously. Each would need a different `codex.md` (different personality), but only one file can exist.

**Mitigation:** Use git worktree isolation. Each parallel agent spawn gets its own worktree copy with its own `codex.md`. This aligns with the existing `08-worktree-and-state.md` isolation pattern.

**Trade-off:** Worktree creation adds ~2-3 seconds per spawn. For sequential execution (wave size = 1), this overhead is unnecessary since there's no collision risk.

### 2. No Per-Spawn Model Selection (Medium Impact)

Claude Code allows `--model sonnet` per spawn. Codex requires model selection in `config.toml`. If different agents need different models (e.g., CTO gets opus, engineers get sonnet), the config must be rewritten before each spawn.

**Mitigation:** The personality compiler could also generate a `config.toml` fragment. Or accept that Codex runs all agents on the same model (simpler, may be acceptable for proof-of-concept).

### 3. Sandbox Restrictions (Medium Impact)

Codex's default sandbox may prevent file writes that the pipeline expects (e.g., writing build reports, updating project.json). Claude Code's `--dangerously-skip-permissions` gives full access.

**Mitigation:** Configure `approval_policy: "full-auto"` in `config.toml` before spawn. This is the Codex equivalent of skip-permissions, but requires config file modification rather than a CLI flag.

## Recommendation

Codex CLI is the closest match to Claude Code's spawn model. The gaps are manageable with worktree isolation and config.toml pre-writing. For Wave 3 (production multi-platform), the `codex.md` collision issue is the critical blocker to solve — worktree isolation is the right answer but adds latency.
