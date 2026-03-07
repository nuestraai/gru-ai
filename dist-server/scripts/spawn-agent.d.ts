#!/usr/bin/env tsx
/**
 * Universal Agent Spawn Entry Point
 *
 * Reads platform from gruai.config.json (defaults to claude-code),
 * instantiates the correct SpawnAdapter, and spawns an agent process
 * in either tracked or detached mode.
 *
 * Usage:
 *   npx tsx scripts/spawn-agent.ts --prompt 'do something' --mode tracked
 *   npx tsx scripts/spawn-agent.ts --agent devon-fullstack --prompt 'build X' --mode tracked
 *   npx tsx scripts/spawn-agent.ts --prompt '/directive test' --mode detached
 *   npx tsx scripts/spawn-agent.ts --agent devon-fullstack --prompt 'test' --mode tracked --model sonnet --cwd /path --output /tmp/log.txt
 */
export {};
