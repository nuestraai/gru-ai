import type { HookEvent } from '../types.js';
interface RawEventBody {
    type?: string;
    sessionId?: string;
    timestamp?: string;
    message?: string;
    project?: string;
    metadata?: Record<string, unknown>;
}
export declare function processEvent(body: RawEventBody): HookEvent;
export {};
