/**
 * ClaudeCodeSpawnAdapter -- SpawnAdapter implementation for Claude Code CLI.
 *
 * Encapsulates the exact `claude -p` CLI invocation with support for both
 * detached (fire-and-forget) and tracked (await completion) spawn modes.
 *
 * Detached mode replicates the foreman.ts pattern: stdio redirected to a log
 * file, process detached from parent, child.unref() called so the parent can
 * exit independently.
 *
 * Tracked mode wraps the child process in a promise that resolves with the
 * exit code, suitable for pipeline steps that need to await completion.
 */
import type { SpawnAdapter, SpawnConfig, SpawnHandle, SpawnMode } from './spawn-adapter.js';
export declare class ClaudeCodeSpawnAdapter implements SpawnAdapter {
    /**
     * Spawn a Claude Code agent process.
     *
     * @param config - What to spawn (prompt, agent, working directory, etc.)
     * @param mode   - `'tracked'` to await completion, `'detached'` for fire-and-forget
     * @returns A handle with the process PID and optional completion promise.
     */
    spawnAgent(config: SpawnConfig, mode: SpawnMode): SpawnHandle;
    /**
     * Kill a previously spawned agent process.
     *
     * Sends SIGTERM to the process. Errors (e.g. process already exited) are
     * silently ignored -- callers should treat kill failures as non-fatal.
     *
     * @param pid - The OS process ID returned in {@link SpawnHandle}.
     */
    killAgent(pid: number): void;
    /**
     * Build the CLI argument array from a SpawnConfig.
     *
     * Argument order: `-p`, optional `--agent`, optional `--model`,
     * optional `--dangerously-skip-permissions`, optional
     * `--no-session-persistence`, then the prompt as the final positional arg.
     */
    private buildArgs;
    /**
     * Build the environment for the child process.
     *
     * Merges `process.env` with the PATH augmentation and any additional
     * env vars from the SpawnConfig. Config env values take highest precedence.
     */
    private buildEnv;
    /**
     * Spawn in detached mode: stdio redirected to `outputPath`, process
     * detached and unref'd so the parent can exit independently.
     */
    private spawnDetached;
    /**
     * Spawn in tracked mode: returns a promise that resolves with the exit
     * code when the process completes. If `outputPath` is set, stdio is
     * also redirected to that file.
     */
    private spawnTracked;
}
