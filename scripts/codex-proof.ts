#!/usr/bin/env tsx
/**
 * Codex CLI Integration Proof Script
 *
 * Validates the SpawnAdapter abstraction works for Codex CLI by:
 * 1. Compiling an agent personality for Codex
 * 2. Instantiating CodexCLISpawnAdapter
 * 3. Attempting a spawn (catching ENOENT if Codex not installed)
 * 4. Outputting a structured JSON report to stdout
 *
 * Designed to pass whether or not Codex CLI is installed.
 *
 * Usage:
 *   npx tsx scripts/codex-proof.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { compilePersonality } from './personality-compiler.js'
import { CodexCLISpawnAdapter } from '../server/platform/codex-cli-spawn.js'

interface ProofReport {
  platform: string
  agentId: string
  personalityCompiled: boolean
  personalityLength: number
  codexMdWritten: boolean
  spawnAttempted: boolean
  spawnSucceeded: boolean
  error?: string
  capabilities: {
    supportsCLISpawn: boolean
    supportsMCP: boolean
    supportsSubagents: boolean
    supportsFileWatching: boolean
    supportsIncrementalReads: boolean
    supportsTokenTracking: boolean
  }
  timestamp: string
}

async function main(): Promise<void> {
  const testAgentId = 'devon'
  const report: ProofReport = {
    platform: 'codex-cli',
    agentId: testAgentId,
    personalityCompiled: false,
    personalityLength: 0,
    codexMdWritten: false,
    spawnAttempted: false,
    spawnSucceeded: false,
    capabilities: {
      supportsCLISpawn: true,
      supportsMCP: true,
      supportsSubagents: false,
      supportsFileWatching: false,
      supportsIncrementalReads: false,
      supportsTokenTracking: false,
    },
    timestamp: new Date().toISOString(),
  }

  // Step 1: Compile personality
  try {
    const personality = compilePersonality(testAgentId, 'codex')
    report.personalityCompiled = true
    report.personalityLength = personality.length
  } catch (err) {
    report.error = `Personality compilation failed: ${err instanceof Error ? err.message : String(err)}`
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
    process.exit(0)
  }

  // Step 2: Attempt spawn in a temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-proof-'))
  const adapter = new CodexCLISpawnAdapter()

  try {
    report.spawnAttempted = true
    const handle = adapter.spawnAgent(
      {
        prompt: 'echo "codex proof test"',
        cwd: tmpDir,
        agentId: testAgentId,
      },
      'tracked',
    )

    // Check if codex.md was written
    const codexMdPath = path.join(tmpDir, 'codex.md')
    report.codexMdWritten = fs.existsSync(codexMdPath)

    // Wait for completion (or ENOENT)
    if (handle.promise) {
      const exitCode = await handle.promise
      report.spawnSucceeded = exitCode === 0
    }
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') {
      report.error = 'ENOENT: codex CLI not installed (expected in proof environment)'
      report.spawnSucceeded = false
    } else {
      report.error = `Spawn failed: ${err instanceof Error ? err.message : String(err)}`
    }

    // Still check if codex.md was written before the spawn error
    const codexMdPath = path.join(tmpDir, 'codex.md')
    report.codexMdWritten = fs.existsSync(codexMdPath)
  } finally {
    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  // Output report
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
  process.exit(0)
}

main()
