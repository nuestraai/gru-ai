import type { SendInputRequest } from '../types.js';
import type { Aggregator } from '../state/aggregator.js';
export declare function sendInput(request: SendInputRequest, aggregator: Aggregator): Promise<{
    ok: boolean;
    error?: string;
}>;
