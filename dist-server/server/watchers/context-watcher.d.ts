import type { ConductorConfig } from '../types.js';
/**
 * Watches .context/ for changes to source files (md, json, tasks.json)
 * and automatically re-runs the state indexer to keep .context/state/ fresh.
 *
 * Pipeline: .context/*.md changes → ContextWatcher → runs index-state.ts →
 * outputs .context/state/*.json → StateWatcher picks up → dashboard updates
 */
export declare class ContextWatcher {
    private watchers;
    private config;
    private debounceTimer;
    private indexing;
    private pendingReindex;
    private _ready;
    constructor(config: ConductorConfig);
    start(): void;
    get ready(): boolean;
    stop(): Promise<void>;
    private handleChange;
    private runIndexer;
}
