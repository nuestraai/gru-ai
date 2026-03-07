import type { Aggregator } from '../state/aggregator.js';
import type { DirectiveState } from '../types.js';
export declare class DirectiveWatcher {
    private directivesWatcher;
    private aggregator;
    private directivesDir;
    private debounceTimer;
    private pollTimer;
    private _ready;
    /** Snapshot of last emitted state hash for change detection in poll fallback */
    private lastStateHash;
    /** mtime-based cache: dirId -> { mtimeMs, state } */
    private historyCache;
    constructor(aggregator: Aggregator, _claudeHome: string);
    start(): void;
    get ready(): boolean;
    stop(): Promise<void>;
    /**
     * Find the active directive (status = in_progress or awaiting_completion)
     * and build DirectiveState from directive.json + project.json files.
     */
    readCurrentState(): DirectiveState | null;
    /**
     * Return DirectiveState[] for all active directives (in_progress, awaiting_completion, reopened).
     * Filters from readAllDirectiveStates() to get only actionable ones.
     */
    readActiveDirectives(): DirectiveState[];
    /**
     * Build DirectiveState[] for ALL directives (completed, failed, in_progress, etc.).
     * Uses mtime-based caching so we only re-parse directive.json when it changes.
     */
    readAllDirectiveStates(): DirectiveState[];
    private buildStateFromDirective;
    private mapProjectStatus;
    private readDirectiveJson;
    private readJson;
    private readTextFile;
    private listDirs;
    /**
     * Poll fallback: check if any directive.json or project.json mtimes changed
     * since the last update. Only triggers readAndUpdate if changes detected.
     */
    private pollForChanges;
    private handleChange;
    private readAndUpdate;
}
