import type { AggregatorHandle } from '../platform/types.js';
export declare class ClaudeWatcher {
    private watcher;
    private aggregator;
    private claudeHome;
    private teamsDebounceTimer;
    private tasksDebounceTimers;
    private pollTimer;
    private lastTeamsMtime;
    private _ready;
    constructor(aggregator: AggregatorHandle, claudeHome: string);
    start(): void;
    get ready(): boolean;
    stop(): Promise<void>;
    private startPollFallback;
    private handleChange;
}
