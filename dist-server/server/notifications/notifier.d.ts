import { EventEmitter } from 'node:events';
import type { Aggregator } from '../state/aggregator.js';
import type { NotificationConfig } from '../types.js';
export declare class Notifier extends EventEmitter {
    private dedup;
    private config;
    private aggregator;
    private prevSessions;
    private cleanupInterval;
    constructor(aggregator: Aggregator, config: NotificationConfig);
    start(): void;
    private handleChange;
    private getStaleTeamSessionIds;
    private notify;
    updateConfig(config: NotificationConfig): void;
    stop(): void;
}
