import type { SessionActivity } from '../types.js';
import type { LastEntryType } from './session-scanner.js';
type MachineState = 'working' | 'needs_input' | 'done';
export interface SessionFileState {
    byteOffset: number;
    mtimeMs: number;
    fileSize: number;
    machineState: MachineState;
    toolUseCount: number;
    toolResultCount: number;
    pendingInputTool: boolean;
    lastActivityAt: string;
    messageCount: number;
    sessionId?: string;
    model?: string;
    cwd?: string;
    gitBranch?: string;
    version?: string;
    slug?: string;
    tasksId?: string;
    initialPrompt?: string;
    latestPrompt?: string;
    agentName?: string;
    agentRole?: string;
    lastToolName?: string;
    lastToolDetail?: string;
}
export interface DiscoveredFile {
    filePath: string;
    sessionId: string;
    project: string;
    projectDir: string;
    isSubagent: boolean;
    parentSessionId?: string;
    agentId?: string;
}
export declare function getFileState(filePath: string, stateMap?: Map<string, SessionFileState>): SessionFileState | undefined;
export declare function getAllFileStates(stateMap?: Map<string, SessionFileState>): Map<string, SessionFileState>;
export declare function removeFileState(filePath: string, stateMap?: Map<string, SessionFileState>): void;
/**
 * Get or bootstrap state for a file. If not in the map, does a cold-start bootstrap.
 */
export declare function getOrBootstrap(filePath: string, stateMap?: Map<string, SessionFileState>): SessionFileState | null;
/**
 * Cold start: read last 64KB, feed through state machine, set byteOffset = fileSize.
 */
export declare function bootstrapFromTail(filePath: string, stateMap?: Map<string, SessionFileState>): SessionFileState | null;
/**
 * Main entry: read new bytes from file, feed through state machine, return updated state.
 * Returns null if no new data.
 */
export declare function processFileUpdate(filePath: string, stateMap?: Map<string, SessionFileState>): SessionFileState | null;
export declare function initializeAllFileStates(claudeHome: string, projectFilter?: string, stateMap?: Map<string, SessionFileState>): Map<string, DiscoveredFile>;
/**
 * Discover .jsonl session files under ~/.claude/projects/.
 * When projectFilter is provided, only scan that single project directory
 * instead of iterating all directories.
 */
export declare function discoverSessionFiles(claudeHome: string, projectFilter?: string): Map<string, DiscoveredFile>;
/**
 * Map machine state to SessionActivity for backward compatibility.
 */
export declare function toSessionActivity(state: SessionFileState): SessionActivity | null;
/**
 * Map machine state to LastEntryType for backward compatibility with deriveSessionStatus.
 */
export declare function machineStateToLastEntryType(state: SessionFileState): LastEntryType;
export {};
