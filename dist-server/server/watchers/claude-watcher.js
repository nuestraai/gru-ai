import path from 'node:path';
import fs from 'node:fs';
import { watch } from 'chokidar';
const UUID_DIR_REGEX = /^[0-9a-f]{8}-/;
export class ClaudeWatcher {
    watcher = null;
    aggregator;
    claudeHome;
    teamsDebounceTimer = null;
    tasksDebounceTimers = new Map();
    pollTimer = null;
    lastTeamsMtime = 0;
    _ready = false;
    constructor(aggregator, claudeHome) {
        this.aggregator = aggregator;
        this.claudeHome = claudeHome;
    }
    start() {
        const teamsDir = path.join(this.claudeHome, 'teams');
        // If directory doesn't exist yet, just start poll fallback (will pick it up when created)
        if (!fs.existsSync(teamsDir)) {
            console.log(`[claude-watcher] Teams directory not found: ${teamsDir}, polling only`);
            this._ready = true;
            this.startPollFallback();
            return;
        }
        const watchPaths = [teamsDir];
        // Also watch tasks dir if it exists
        const tasksDir = path.join(this.claudeHome, 'tasks');
        if (fs.existsSync(tasksDir)) {
            watchPaths.push(tasksDir);
        }
        console.log(`[claude-watcher] Watching ${watchPaths.join(', ')}`);
        this.watcher = watch(watchPaths, {
            ignoreInitial: true,
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 50,
            },
        });
        this.watcher.on('all', (_event, filePath) => {
            // Only care about JSON files
            if (!filePath.endsWith('.json'))
                return;
            this.handleChange(filePath);
        });
        this.watcher.on('ready', () => {
            this._ready = true;
            console.log(`[claude-watcher] Ready`);
        });
        this.watcher.on('error', (err) => {
            console.error(`[claude-watcher] Error:`, err);
        });
        this.startPollFallback();
    }
    get ready() {
        return this._ready;
    }
    async stop() {
        if (this.teamsDebounceTimer) {
            clearTimeout(this.teamsDebounceTimer);
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        for (const timer of this.tasksDebounceTimers.values()) {
            clearTimeout(timer);
        }
        this.tasksDebounceTimers.clear();
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
    }
    startPollFallback() {
        if (this.pollTimer)
            return;
        this.pollTimer = setInterval(() => {
            const teamsDir = path.join(this.claudeHome, 'teams');
            try {
                const stat = fs.statSync(teamsDir);
                if (stat.mtimeMs !== this.lastTeamsMtime) {
                    this.lastTeamsMtime = stat.mtimeMs;
                    this.aggregator.refreshTeams();
                }
            }
            catch {
                // teams dir may not exist yet
            }
        }, 5000);
    }
    handleChange(filePath) {
        const teamsDir = path.join(this.claudeHome, 'teams');
        const tasksDir = path.join(this.claudeHome, 'tasks');
        if (filePath.startsWith(teamsDir)) {
            // Teams config changed — debounce per teams dir
            if (this.teamsDebounceTimer) {
                clearTimeout(this.teamsDebounceTimer);
            }
            this.teamsDebounceTimer = setTimeout(() => {
                console.log(`[claude-watcher] Teams config changed, refreshing teams`);
                this.aggregator.refreshTeams();
                this.teamsDebounceTimer = null;
            }, 300);
        }
        else if (filePath.startsWith(tasksDir)) {
            // Task file changed — extract teamName and debounce per team
            const relative = path.relative(tasksDir, filePath);
            const parts = relative.split(path.sep);
            if (parts.length < 1)
                return;
            const teamName = parts[0];
            // Skip UUID-named directories
            if (UUID_DIR_REGEX.test(teamName))
                return;
            // Debounce per team name
            const existing = this.tasksDebounceTimers.get(teamName);
            if (existing) {
                clearTimeout(existing);
            }
            this.tasksDebounceTimers.set(teamName, setTimeout(() => {
                console.log(`[claude-watcher] Tasks changed for team "${teamName}", refreshing tasks`);
                this.aggregator.refreshTasks(teamName);
                this.tasksDebounceTimers.delete(teamName);
            }, 300));
        }
    }
}
