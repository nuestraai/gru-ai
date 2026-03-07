#!/usr/bin/env tsx
/**
 * Personality Compiler
 *
 * Reads agent personality files (.claude/agents/*.md) and compiles them
 * for different platforms. For Claude Code: no-op (agents already in
 * correct format). For Codex: flattens personality to plain prose.
 *
 * Usage:
 *   npx tsx scripts/personality-compiler.ts --agent devon-fullstack --platform claude-code
 *   npx tsx scripts/personality-compiler.ts --agent devon-fullstack --platform codex
 */
export declare function compilePersonality(agentId: string, platform: string): string;
