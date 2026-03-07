import fs from 'node:fs';
import path from 'node:path';
function parseTimestamp(raw) {
    if (typeof raw === 'number')
        return new Date(raw).toISOString();
    if (typeof raw === 'string')
        return raw;
    return new Date().toISOString();
}
function parseMember(raw) {
    return {
        name: raw.name ?? 'unnamed',
        agentId: raw.agentId ?? '',
        agentType: raw.agentType ?? 'unknown',
        model: raw.model ?? '',
        tmuxPaneId: raw.tmuxPaneId ?? '',
        cwd: raw.cwd ?? '',
        color: raw.color ?? '',
        isActive: raw.isActive ?? false,
        backendType: raw.backendType ?? '',
        joinedAt: parseTimestamp(raw.joinedAt),
    };
}
export function parseTeamConfig(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return null;
        const content = fs.readFileSync(filePath, 'utf-8');
        const raw = JSON.parse(content);
        const members = (raw.members ?? []).map(parseMember);
        return {
            name: raw.name ?? path.basename(path.dirname(filePath)),
            description: raw.description ?? '',
            members,
            createdAt: parseTimestamp(raw.createdAt),
            leadAgentId: raw.leadAgentId ?? '',
            leadSessionId: raw.leadSessionId ?? '',
            stale: false,
        };
    }
    catch (err) {
        console.error(`[team-parser] Error parsing ${filePath}:`, err);
        return null;
    }
}
export function parseAllTeams(claudeHome) {
    const teamsDir = path.join(claudeHome, 'teams');
    const teams = [];
    try {
        if (!fs.existsSync(teamsDir))
            return [];
        const entries = fs.readdirSync(teamsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            const configPath = path.join(teamsDir, entry.name, 'config.json');
            const team = parseTeamConfig(configPath);
            if (team) {
                teams.push(team);
            }
        }
    }
    catch (err) {
        console.error(`[team-parser] Error scanning teams directory:`, err);
    }
    return teams;
}
