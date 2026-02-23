import { useState, useMemo } from 'react';
import { useDashboardStore } from '@/stores/dashboard-store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LayoutGrid, List } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import SessionTree from './SessionTree';
import type { Session, ProjectGroup } from '@/stores/types';

const TIME_FILTERS = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24h' },
  { value: 'all', label: 'All' },
] as const;

type TimeFilter = typeof TIME_FILTERS[number]['value'];

function passesTimeFilter(session: Session, filter: TimeFilter): boolean {
  if (filter === 'all') return true;

  const cutoff = filter === '1h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return Date.now() - new Date(session.lastActivity).getTime() < cutoff;
}

function emptyMessage(timeFilter: TimeFilter): string {
  if (timeFilter === '1h') return 'No sessions in the last hour';
  if (timeFilter === '24h') return 'No sessions in the last 24 hours';
  return 'No sessions found';
}

export default function SessionsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1h');
  const [view, setView] = useState<'kanban' | 'tree'>('kanban');
  const { sessions, projects, teams, sessionActivities, tasksBySession } = useDashboardStore();

  // Filter parent sessions by time, then include all their subagents
  const { filteredSessions, filteredProjects } = useMemo(() => {
    const matchedParentIds = new Set(
      sessions
        .filter((s) => !s.isSubagent && passesTimeFilter(s, timeFilter))
        .map((s) => s.id)
    );

    const filtered = sessions.filter((s) => {
      if (!s.isSubagent) return matchedParentIds.has(s.id);
      // Subagents must belong to a matched parent AND pass time filter themselves
      if (!s.parentSessionId || !matchedParentIds.has(s.parentSessionId)) return false;
      return passesTimeFilter(s, timeFilter);
    });

    const projectList = projects
      .map((p): ProjectGroup => ({
        ...p,
        sessions: p.sessions.filter((s) => matchedParentIds.has(s.id)),
      }))
      .filter((p) => p.sessions.length > 0);

    return { filteredSessions: filtered, filteredProjects: projectList };
  }, [sessions, projects, timeFilter]);

  // Build session->team lookup
  const sessionTeamMap = useMemo(() => {
    const map = new Map<string, { teamName: string; memberName: string }>();
    for (const team of teams) {
      if (team.leadSessionId) {
        map.set(team.leadSessionId, { teamName: team.name, memberName: 'lead' });
      }
      for (const member of team.members) {
        if (member.agentId) {
          map.set(member.agentId, { teamName: team.name, memberName: member.name });
        }
      }
    }
    return map;
  }, [teams]);

  // Build session->paneId lookup
  const sessionPaneMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessions) {
      if (session.paneId) {
        map.set(session.id, session.paneId);
      }
    }
    for (const team of teams) {
      for (const member of team.members) {
        if (member.agentId && member.tmuxPaneId) {
          map.set(member.agentId, member.tmuxPaneId);
        }
      }
    }
    return map;
  }, [teams, sessions]);

  // Counts for filter badges
  const timeFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of TIME_FILTERS) {
      counts[f.value] = sessions.filter((s) => !s.isSubagent && passesTimeFilter(s, f.value)).length;
    }
    return counts;
  }, [sessions]);

  const hasContent = view === 'kanban'
    ? filteredSessions.some((s) => !s.isSubagent)
    : filteredProjects.length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {/* Time filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Time:</span>
          {TIME_FILTERS.map((f) => (
            <Badge
              key={f.value}
              variant={timeFilter === f.value ? 'default' : 'secondary'}
              className={cn(
                'cursor-pointer transition-colors',
                timeFilter === f.value ? '' : 'hover:bg-secondary/80'
              )}
              onClick={() => setTimeFilter(f.value)}
            >
              {f.label} {timeFilterCounts[f.value] > 0 && `(${timeFilterCounts[f.value]})`}
            </Badge>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('kanban')}
            className={cn(
              'p-1.5 rounded transition-colors',
              view === 'kanban' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Board view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('tree')}
            className={cn(
              'p-1.5 rounded transition-colors',
              view === 'tree' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Tree view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* View content */}
      {!hasContent ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{emptyMessage(timeFilter)}</p>
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          sessions={filteredSessions}
          sessionActivities={sessionActivities}
          sessionTeamMap={sessionTeamMap}
          sessionPaneMap={sessionPaneMap}
          tasksBySession={tasksBySession}
        />
      ) : (
        <SessionTree
          projects={filteredProjects}
          allSessions={filteredSessions}
          sessionActivities={sessionActivities}
          sessionTeamMap={sessionTeamMap}
          sessionPaneMap={sessionPaneMap}
        />
      )}
    </div>
  );
}
