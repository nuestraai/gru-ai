export type LastEntryType = 'user' | 'assistant-tool' | 'assistant-text' | 'assistant-question' | 'unknown';
export declare function projectLabel(dirName: string): string;
/**
 * Derive the Claude projects directory name from an absolute repo path.
 * Inverse of the encoding Claude Code uses: `/Users/foo/bar` → `-Users-foo-bar`
 */
export declare function projectDirFromPath(repoPath: string): string;
export declare function cleanPromptText(raw: string): string | undefined;
export declare function extractInitialPrompt(filepath: string): string | undefined;
/**
 * Extract a named agent identity from the initial prompt of a subagent.
 * Detects patterns like "You are Alex Rivera, Chief of Staff" or "You are Sarah Chen, CTO"
 * Returns { name, role } if found, undefined otherwise.
 */
export declare function extractAgentIdentity(promptText: string): {
    name: string;
    role: string;
} | undefined;
/**
 * Extract agent identity from a JSONL file's first user message.
 * Reads the head of the file to find the initial prompt, then checks for agent identity patterns.
 */
export declare function extractAgentIdentityFromFile(filepath: string): {
    name: string;
    role: string;
} | undefined;
/**
 * Scan a parent session JSONL for Agent tool_use/tool_result pairs.
 * Returns a map of agentId → subagent_type (e.g. "a4df5875a493548ce" → "alex").
 * Results are cached per parent file and invalidated on mtime change.
 */
export declare function extractSubagentTypesFromParent(parentFilePath: string, cache?: Map<string, {
    mtime: number;
    map: Map<string, string>;
}>): Map<string, string>;
/**
 * Look up agent identity for a subagent by checking the parent session's Agent tool calls.
 * Returns { name, role } if the subagent was spawned with a known subagent_type, undefined otherwise.
 */
export declare function resolveAgentFromParent(parentFilePath: string, childAgentId: string, cache?: Map<string, {
    mtime: number;
    map: Map<string, string>;
}>): {
    name: string;
    role: string;
} | undefined;
/**
 * Look up a known agent by its CLI agent-setting name (e.g. "riley", "sarah").
 * Returns { name, role } if known, undefined otherwise.
 */
export declare function resolveAgentFromSetting(agentSetting: string): {
    name: string;
    role: string;
} | undefined;
export declare function isSystemContent(text: string): boolean;
export declare function extractLatestPrompt(filepath: string): string | undefined;
