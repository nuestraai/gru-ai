import fs from 'node:fs';
import path from 'node:path';
const UUID_DIR_REGEX = /^[0-9a-f]{8}-/;
function normalizeStatus(raw) {
    if (!raw)
        return 'pending';
    const lower = raw.toLowerCase().trim();
    if (lower === 'completed' || lower === 'done')
        return 'completed';
    if (lower === 'in_progress' || lower === 'in-progress')
        return 'in_progress';
    return 'pending';
}
function parseRawTask(raw) {
    return {
        id: raw.id ?? '',
        subject: raw.subject ?? '',
        description: raw.description ?? '',
        activeForm: raw.activeForm ?? '',
        status: normalizeStatus(raw.status),
        owner: raw.owner ?? '',
        blocks: raw.blocks ?? [],
        blockedBy: raw.blockedBy ?? [],
    };
}
export function parseTeamTasks(claudeHome, teamName) {
    const tasksDir = path.join(claudeHome, 'tasks', teamName);
    try {
        if (!fs.existsSync(tasksDir))
            return [];
        const entries = fs.readdirSync(tasksDir, { withFileTypes: true });
        const tasks = [];
        for (const entry of entries) {
            // Skip non-JSON files
            if (!entry.isFile() || !entry.name.endsWith('.json'))
                continue;
            const filePath = path.join(tasksDir, entry.name);
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const raw = JSON.parse(content);
                tasks.push(parseRawTask(raw));
            }
            catch {
                // Skip malformed files
            }
        }
        return tasks;
    }
    catch {
        return [];
    }
}
export function parseAllTeamTasks(claudeHome, teamNames) {
    const result = {};
    for (const teamName of teamNames) {
        result[teamName] = parseTeamTasks(claudeHome, teamName);
    }
    return result;
}
/**
 * Parse all task directories, splitting into team-named and UUID-named (session) dirs.
 */
export function parseAllTasks(claudeHome, knownTeamNames) {
    const tasksRoot = path.join(claudeHome, 'tasks');
    const byTeam = {};
    const bySession = {};
    let dirs;
    try {
        dirs = fs.readdirSync(tasksRoot).filter((d) => {
            try {
                return fs.statSync(path.join(tasksRoot, d)).isDirectory();
            }
            catch {
                return false;
            }
        });
    }
    catch {
        return { byTeam, bySession };
    }
    for (const dirName of dirs) {
        const tasks = parseTeamTasks(claudeHome, dirName);
        if (tasks.length === 0)
            continue;
        if (knownTeamNames.has(dirName)) {
            byTeam[dirName] = tasks;
        }
        else if (UUID_DIR_REGEX.test(dirName)) {
            bySession[dirName] = tasks;
        }
        else {
            // Unknown non-UUID dir — include in byTeam as a fallback
            byTeam[dirName] = tasks;
        }
    }
    return { byTeam, bySession };
}
