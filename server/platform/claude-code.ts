/**
 * ClaudeCodeAdapter -- PlatformAdapter implementation for Claude Code.
 *
 * Wraps existing session-state and session-scanner logic behind the
 * PlatformAdapter interface (Strangler Fig pattern). Singleton state
 * (fileStates Map, parentAgentMapCache) is moved to instance properties.
 */

import type {
  PlatformAdapter,
  PlatformCapabilities,
  AggregatorHandle,
  AgentState,
  SessionWatcher as SessionWatcherInterface,
  MetadataWatcher as MetadataWatcherInterface,
} from './types.js';
import type { SessionActivity, ProjectConfig, ConductorConfig } from '../types.js';
import type { SessionFileState, DiscoveredFile } from '../parsers/session-state.js';
import {
  initializeAllFileStates,
  discoverSessionFiles,
  getAllFileStates as getAllFileStatesRaw,
  getOrBootstrap as getOrBootstrapRaw,
  removeFileState as removeFileStateRaw,
  processFileUpdate as processFileUpdateRaw,
  toSessionActivity as toSessionActivityRaw,
  machineStateToLastEntryType,
} from '../parsers/session-state.js';
import { discoverProjects, loadConfig } from '../config.js';
import { SessionWatcher } from '../watchers/session-watcher.js';
import { ClaudeWatcher } from '../watchers/claude-watcher.js';

export class ClaudeCodeAdapter implements PlatformAdapter {
  /** Instance-level session file state map (replaces module-level singleton). */
  readonly fileStates = new Map<string, SessionFileState>();

  /** Instance-level parent agent map cache (replaces module-level singleton). */
  readonly parentAgentMapCache = new Map<string, { mtime: number; map: Map<string, string> }>();

  private readonly claudeHome: string;

  constructor(claudeHome: string) {
    this.claudeHome = claudeHome;
  }

  // -------------------------------------------------------------------------
  // Core state methods
  // -------------------------------------------------------------------------

  discoverSessionFiles(projectFilter?: string): Map<string, DiscoveredFile> {
    return discoverSessionFiles(this.claudeHome, projectFilter);
  }

  initializeAllFileStates(projectFilter?: string): Map<string, DiscoveredFile> {
    return initializeAllFileStates(this.claudeHome, projectFilter, this.fileStates);
  }

  processFileUpdate(filePath: string): SessionFileState | null {
    return processFileUpdateRaw(filePath, this.fileStates);
  }

  getOrBootstrap(filePath: string): SessionFileState | null {
    return getOrBootstrapRaw(filePath, this.fileStates);
  }

  removeFileState(filePath: string): void {
    removeFileStateRaw(filePath, this.fileStates);
  }

  getAllFileStates(): Map<string, SessionFileState> {
    return getAllFileStatesRaw(this.fileStates);
  }

  // -------------------------------------------------------------------------
  // Conversion methods
  // -------------------------------------------------------------------------

  toSessionActivity(state: SessionFileState): SessionActivity | null {
    return toSessionActivityRaw(state);
  }

  getAgentState(state: SessionFileState): AgentState {
    const lastEntryType = machineStateToLastEntryType(state);
    switch (lastEntryType) {
      case 'assistant-tool':
        return 'working';
      case 'assistant-question':
        return 'needs_input';
      case 'assistant-text':
        return 'done';
      case 'user':
        return 'working';
      default:
        return 'unknown';
    }
  }

  // -------------------------------------------------------------------------
  // Factory methods
  // -------------------------------------------------------------------------

  createSessionWatcher(aggregator: AggregatorHandle, projectFilter?: string): SessionWatcherInterface {
    return new SessionWatcher(aggregator, this.claudeHome, projectFilter, this);
  }

  createMetadataWatcher(aggregator: AggregatorHandle): MetadataWatcherInterface | null {
    return new ClaudeWatcher(aggregator, this.claudeHome);
  }

  // -------------------------------------------------------------------------
  // Config methods
  // -------------------------------------------------------------------------

  discoverProjects(): ProjectConfig[] {
    return discoverProjects(this.claudeHome);
  }

  loadConfig(): ConductorConfig {
    return loadConfig();
  }

  // -------------------------------------------------------------------------
  // Capability method
  // -------------------------------------------------------------------------

  getPlatformCapabilities(): PlatformCapabilities {
    return {
      supportsFileWatching: true,
      supportsIncrementalReads: true,
      supportsCLISpawn: true,
      supportsMCP: true,
      supportsSubagents: true,
      supportsTokenTracking: false,
    };
  }
}
