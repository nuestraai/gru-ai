/**
 * Platform adapter module -- re-exports all types from the platform boundary.
 */
export type { AggregatorHandle, AgentState, PlatformCapabilities, SessionWatcher, MetadataWatcher, PlatformAdapter, } from './types.js';
export type { SpawnMode, SpawnConfig, SpawnHandle, SpawnAdapter, } from './spawn-adapter.js';
export { ClaudeCodeAdapter } from './claude-code.js';
export { ClaudeCodeSpawnAdapter } from './claude-code-spawn.js';
export { CodexCLISpawnAdapter } from './codex-cli-spawn.js';
