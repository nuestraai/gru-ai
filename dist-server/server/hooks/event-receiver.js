import crypto from 'node:crypto';
import { insertEvent } from '../db.js';
export function processEvent(body) {
    const event = {
        id: crypto.randomUUID(),
        type: body.type ?? 'unknown',
        sessionId: body.sessionId ?? 'unknown',
        timestamp: body.timestamp ?? new Date().toISOString(),
        message: body.message ?? formatDefaultMessage(body.type),
        project: body.project,
        metadata: body.metadata,
    };
    // Persist to SQLite
    insertEvent(event);
    return event;
}
function formatDefaultMessage(type) {
    switch (type) {
        case 'stop':
            return 'Agent session stopped';
        case 'task_completed':
            return 'Task completed';
        case 'teammate_idle':
            return 'Teammate is idle';
        case 'permission_prompt':
            return 'Agent needs permission';
        case 'idle_prompt':
            return 'Agent needs input';
        case 'elicitation_dialog':
            return 'Agent needs input';
        case 'error':
            return 'Agent encountered an error';
        default:
            return `Event: ${type ?? 'unknown'}`;
    }
}
