/**
 * Spawn adapter interface for agent process lifecycle management.
 *
 * This module defines the contract for spawning and managing agent processes
 * across different platforms. SpawnAdapter is intentionally separate from
 * PlatformAdapter -- monitoring (PlatformAdapter) and execution (SpawnAdapter)
 * are different concerns with different lifecycles.
 *
 * Gate: consumers should check `PlatformCapabilities.supportsCLISpawn` before
 * attempting to use a SpawnAdapter.
 */
export {};
