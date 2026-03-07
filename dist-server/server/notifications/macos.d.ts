/**
 * Send a macOS notification via osascript.
 * Fire-and-forget: does not await, logs errors silently.
 */
export declare function sendMacNotification(title: string, body: string): void;
