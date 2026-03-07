import type { AggregatorHandle } from '../platform/types.js';
import type { PlatformAdapter } from '../platform/types.js';
export declare class SessionWatcher {
    private watcher;
    private aggregator;
    private claudeHome;
    private projectFilter?;
    private adapter;
    private activityTimers;
    private sessionRefreshTimer;
    private _ready;
    constructor(aggregator: AggregatorHandle, claudeHome: string, projectFilter?: string, adapter?: PlatformAdapter);
    start(): void;
    get ready(): boolean;
    stop(): Promise<void>;
    private scheduleSessionRefresh;
    private handleActivityChange;
}
