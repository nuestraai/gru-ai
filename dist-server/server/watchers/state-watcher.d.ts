import type { Aggregator } from '../state/aggregator.js';
import type { ConductorConfig } from '../types.js';
import type { FullWorkState } from '../state/work-item-types.js';
/**
 * Watches .context/ source files (directive.json, project.json,
 * reports, lessons) and builds FullWorkState directly.
 *
 * Replaces the old two-stage pipeline (ContextWatcher -> indexer -> state/*.json -> StateWatcher).
 * Now reads source files directly via glob patterns.
 */
export declare class StateWatcher {
    private watchers;
    private aggregator;
    private config;
    private debounceTimer;
    private _ready;
    private _state;
    constructor(aggregator: Aggregator, config: ConductorConfig);
    start(): void;
    get ready(): boolean;
    stop(): Promise<void>;
    readCurrentState(): FullWorkState;
    /** Force a re-read of all source files */
    refresh(): void;
    private handleChange;
    private readAndUpdate;
    private mapProjectStatus;
    private mapDirectiveStatus;
    private mapBacklogStatus;
    private mapPriority;
    private readJson;
    private listDirs;
    private listFiles;
    private extractFirstHeading;
    private fileMtime;
}
