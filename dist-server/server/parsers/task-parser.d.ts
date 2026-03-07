import type { TeamTask } from '../types.js';
export declare function parseTeamTasks(claudeHome: string, teamName: string): TeamTask[];
export declare function parseAllTeamTasks(claudeHome: string, teamNames: string[]): Record<string, TeamTask[]>;
/**
 * Parse all task directories, splitting into team-named and UUID-named (session) dirs.
 */
export declare function parseAllTasks(claudeHome: string, knownTeamNames: Set<string>): {
    byTeam: Record<string, TeamTask[]>;
    bySession: Record<string, TeamTask[]>;
};
