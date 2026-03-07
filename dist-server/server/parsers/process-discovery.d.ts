export interface ItermSessionInfo {
    itermId: string;
    tty: string;
    name: string;
    cwd?: string;
    sessionId?: string;
}
export interface ClaudePaneMapping {
    /** Map of tasks dir name (UUID or named) → pane ID (tmux "%N" or "iterm:{uniqueId}") */
    byTasksDir: Map<string, string>;
    /** Map of claude PID → tmux pane ID */
    byPid: Map<number, string>;
    /** Map of session UUID → pane ID (from project dir paths in lsof) */
    bySessionId: Map<string, string>;
    /** Map of normalized pane title → pane ID (for fuzzy matching with initialPrompt) */
    byPaneTitle: Map<string, string>;
    /** Map of pane ID → array of user prompt strings captured from scrollback */
    panePrompts: Map<string, string[]>;
    /** Map of claude PID → iTerm2 session info (non-tmux sessions) */
    byItermSession: Map<number, ItermSessionInfo>;
    /** iTerm sessions with no matching claude process (for CWD-based matching) */
    orphanItermSessions: Array<{
        itermId: string;
        tty: string;
        name: string;
        cwd?: string;
        candidateSessionIds: string[];
    }>;
}
/**
 * Discover all running claude processes and map them to tmux panes.
 *
 * Strategy:
 * 1. Get all tmux pane PIDs
 * 2. Find all `claude` processes via `pgrep`
 * 3. Walk each claude process's parent chain to find its tmux pane
 * 4. Extract tasks dir + session IDs from lsof (open files under ~/.claude/)
 */
export declare function discoverClaudePanes(): Promise<ClaudePaneMapping>;
