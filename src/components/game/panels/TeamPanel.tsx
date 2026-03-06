// ---------------------------------------------------------------------------
// TeamPanel — game-style agent roster with pixel-art cards
// ---------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import { Swords, Fish, Users, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { useDashboardStore } from '@/stores/dashboard-store';
import QuickActions from '@/components/shared/QuickActions';
import { OFFICE_AGENTS, type AgentStatus } from '../types';
import registry from '../../../../.claude/agent-registry.json';
import {
  SectionHeader, StatusChip, PIXEL_CARD, PIXEL_CARD_RAISED,
  ParchmentDivider, PARCHMENT,
} from './panelUtils';

// ---------------------------------------------------------------------------
// Team data from registry
// ---------------------------------------------------------------------------

const TEAMS = registry.teams;

/** Map agent first name -> team name */
const AGENT_TEAM_MAP: Record<string, string> = {};
/** Map agent first name -> full role */
const AGENT_FULL_ROLE: Record<string, string> = {};
for (const team of TEAMS) {
  for (const memberId of team.memberAgentIds) {
    const agent = registry.agents.find((a) => a.id === memberId);
    if (agent) {
      AGENT_TEAM_MAP[agent.name.split(' ')[0]] = team.name;
    }
  }
}
for (const agent of registry.agents) {
  AGENT_FULL_ROLE[agent.name.split(' ')[0]] = agent.role;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TeamPanelProps {
  agentStatuses: Record<string, AgentStatus>;
  onSelectAgent?: (agentName: string) => void;
}

// ---------------------------------------------------------------------------
// Derived agent info
// ---------------------------------------------------------------------------

interface AgentInfo {
  agent: (typeof OFFICE_AGENTS)[0];
  status: AgentStatus;
  taskName: string | undefined;
  toolName: string | undefined;
  toolDetail: string | undefined;
  lastActivity: string | undefined;
  sessionStatus: string | undefined;
  paneId: string | undefined;
  terminalApp: string | undefined;
  gitBranch: string | undefined;
  subagentNames: string[];
}

/** Extract a meaningful task description from a session prompt */
function extractTask(prompt: string | undefined): string | undefined {
  if (!prompt) return undefined;
  const afterIntro = prompt.replace(/^You are [^.]+\.\s*/i, '');
  if (afterIntro === prompt || !afterIntro) return undefined;
  const first = afterIntro.split(/[.\n]/)[0]?.trim();
  return first ? (first.length > 80 ? first.slice(0, 77) + '...' : first) : undefined;
}

// ---------------------------------------------------------------------------
// KPI strip — compact team status summary
// ---------------------------------------------------------------------------

function TeamKpi({
  working,
  waiting,
  idle,
  directiveName,
  directiveStatus,
}: {
  working: number;
  waiting: number;
  idle: number;
  directiveName: string | null;
  directiveStatus: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      {/* Directive banner */}
      {directiveName && (
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 font-mono"
          style={PIXEL_CARD}
        >
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 leading-none shrink-0"
            style={{
              backgroundColor: directiveStatus === 'awaiting_completion' ? '#FDE68A' : '#BBF7D0',
              color: directiveStatus === 'awaiting_completion' ? '#92400E' : '#052E16',
              borderRadius: '2px',
            }}
          >
            {directiveStatus === 'awaiting_completion' ? 'Review' : 'Active'}
          </span>
          <span
            className="text-[10px] font-bold truncate"
            style={{ color: PARCHMENT.text }}
          >
            {directiveName}
          </span>
        </div>
      )}

      {/* Status counters */}
      <div className="flex gap-1.5">
        <div
          className="flex-1 flex items-center gap-1.5 px-2 py-1.5 font-mono"
          style={PIXEL_CARD}
        >
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: '#22C55E', boxShadow: working > 0 ? '0 0 4px #22C55E80' : 'none' }}
          />
          <span className="text-sm font-bold tabular-nums" style={{ color: PARCHMENT.text }}>
            {working}
          </span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: PARCHMENT.textDim }}>
            Working
          </span>
        </div>
        <div
          className="flex-1 flex items-center gap-1.5 px-2 py-1.5 font-mono"
          style={PIXEL_CARD}
        >
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: waiting > 0 ? '#EAB308' : '#9CA3AF' }}
          />
          <span className="text-sm font-bold tabular-nums" style={{ color: PARCHMENT.text }}>
            {waiting}
          </span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: PARCHMENT.textDim }}>
            Waiting
          </span>
        </div>
        <div
          className="flex-1 flex items-center gap-1.5 px-2 py-1.5 font-mono"
          style={PIXEL_CARD}
        >
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: '#9CA3AF' }}
          />
          <span className="text-sm font-bold tabular-nums" style={{ color: PARCHMENT.text }}>
            {idle}
          </span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: PARCHMENT.textDim }}>
            Loafing
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Idle empty state — when nobody is working
// ---------------------------------------------------------------------------

function IdleEmptyState() {
  return (
    <div className="text-center py-5 font-mono" style={PIXEL_CARD}>
      <Fish
        className="h-6 w-6 mx-auto mb-2"
        style={{ color: PARCHMENT.textDim, opacity: 0.4 }}
        aria-hidden="true"
      />
      <p className="text-xs font-bold" style={{ color: PARCHMENT.text }}>
        Everyone's loafing
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: PARCHMENT.textDim }}>
        No agents are currently working
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TeamPanel({ agentStatuses, onSelectAgent }: TeamPanelProps) {
  const sessions = useDashboardStore((s) => s.sessions);
  const sessionActivities = useDashboardStore((s) => s.sessionActivities);
  const directiveState = useDashboardStore((s) => s.directiveState);
  const [offDutyExpanded, setOffDutyExpanded] = useState(false);

  const agentData = useMemo(() => {
    const active: AgentInfo[] = [];
    const inactive: Array<{
      agent: (typeof OFFICE_AGENTS)[0];
      status: AgentStatus;
      lastFeature?: string;
      lastActivity?: string;
      team?: string;
      fullRole?: string;
      sessionCount: number;
    }> = [];

    for (const a of OFFICE_AGENTS) {
      if (a.isPlayer) continue;
      const st = agentStatuses[a.agentName] ?? 'offline';

      // Total session count for this agent
      const allAgentSessions = sessions.filter((s) => s.agentName === a.agentName);

      if (st === 'working' || st === 'waiting' || st === 'error') {
        const activeSessions = allAgentSessions.filter((s) => s.status !== 'done');
        const sorted = [...activeSessions].sort(
          (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
        );

        let taskName: string | undefined;
        let bestLastActivity: string | undefined;
        let bestSessionStatus: string | undefined;
        let bestPaneId: string | undefined;
        let bestTerminalApp: string | undefined;
        let gitBranch: string | undefined;

        for (const s of sorted) {
          if (!taskName && s.feature) taskName = s.feature;
          if (!taskName) {
            const extracted = extractTask(s.latestPrompt ?? s.initialPrompt);
            if (extracted) taskName = extracted;
          }
          if (!bestLastActivity) bestLastActivity = s.lastActivity;
          if (!bestSessionStatus && (s.status === 'working' || s.status === 'waiting-approval' || s.status === 'waiting-input')) {
            bestSessionStatus = s.status;
            bestPaneId = s.paneId;
            bestTerminalApp = s.terminalApp;
          }
          if (!gitBranch && s.gitBranch) gitBranch = s.gitBranch;
        }

        let toolName: string | undefined;
        let toolDetail: string | undefined;
        for (const s of sorted) {
          const act = sessionActivities[s.id];
          if (act?.active && act.tool) {
            toolName = act.tool;
            toolDetail = act.detail;
            break;
          }
        }
        if (!toolName) {
          for (const s of sorted) {
            const act = sessionActivities[s.id];
            if (act?.active && act.thinking) {
              toolName = 'thinking';
              break;
            }
          }
        }

        const primary = sorted.find((s) => !s.isSubagent);
        const subagentNames = primary?.activeSubagentNames ?? [];

        active.push({
          agent: a,
          status: st,
          taskName,
          toolName,
          toolDetail,
          lastActivity: bestLastActivity,
          sessionStatus: bestSessionStatus ?? 'working',
          paneId: bestPaneId,
          terminalApp: bestTerminalApp,
          gitBranch,
          subagentNames,
        });
      } else {
        const sorted = [...allAgentSessions].sort(
          (x, y) => new Date(y.lastActivity).getTime() - new Date(x.lastActivity).getTime(),
        );
        const lastSession = sorted[0];

        inactive.push({
          agent: a,
          status: st,
          lastFeature: lastSession?.feature ?? undefined,
          lastActivity: lastSession?.lastActivity ?? undefined,
          team: AGENT_TEAM_MAP[a.agentName],
          fullRole: AGENT_FULL_ROLE[a.agentName],
          sessionCount: allAgentSessions.length,
        });
      }
    }
    return { active, inactive };
  }, [agentStatuses, sessions, sessionActivities]);

  // KPI counts
  const workingCount = agentData.active.filter((a) => a.status === 'working').length;
  const waitingCount = agentData.active.filter((a) => a.status === 'waiting' || a.status === 'error').length;
  const idleCount = agentData.inactive.length;
  const directiveName = directiveState?.title ?? directiveState?.directiveName ?? null;

  return (
    <div className="space-y-2">
      {/* KPI strip — always visible, passes 3-second test */}
      <TeamKpi
        working={workingCount}
        waiting={waitingCount}
        idle={idleCount}
        directiveName={directiveName}
        directiveStatus={directiveState?.status}
      />

      {/* Active agents */}
      {agentData.active.length > 0 && (
        <>
          <ParchmentDivider />
          <div className="space-y-1.5">
            <SectionHeader
              icon={<Swords className="h-3 w-3" />}
              count={agentData.active.length}
              color="#5B8C3E"
            >
              Working
            </SectionHeader>

            {agentData.active.map((info) => {
              const isWaiting = info.sessionStatus === 'waiting-approval' || info.sessionStatus === 'waiting-input';

              return (
                <button
                  key={info.agent.agentName}
                  type="button"
                  className="w-full text-left p-0 transition-all cursor-pointer group"
                  style={{
                    ...PIXEL_CARD_RAISED,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={() => onSelectAgent?.(info.agent.agentName)}
                  aria-label={`View ${info.agent.agentName} details`}
                >
                  {/* Colored left accent bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{
                      backgroundColor: info.agent.color,
                      boxShadow: `1px 0 0 0 ${info.agent.color}40`,
                    }}
                  />

                  <div className="pl-3 pr-2 py-2 space-y-1">
                    {/* Row 1: Agent name + status */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-sm shrink-0',
                          info.status === 'working' && 'animate-pulse',
                        )}
                        style={{
                          backgroundColor: info.agent.color,
                          boxShadow: info.status === 'working'
                            ? `0 0 6px ${info.agent.color}80`
                            : `0 0 2px ${info.agent.color}40`,
                        }}
                      />
                      <span
                        className="text-xs font-bold font-mono truncate"
                        style={{ color: PARCHMENT.text }}
                      >
                        {info.agent.agentName}
                      </span>
                      <span className="ml-auto shrink-0 flex items-center gap-1">
                        {info.lastActivity && (
                          <span
                            className="text-[9px] font-mono tabular-nums"
                            style={{ color: PARCHMENT.textDim }}
                          >
                            {timeAgo(info.lastActivity)}
                          </span>
                        )}
                        <StatusChip
                          status={info.sessionStatus ?? 'working'}
                          animated={info.status === 'working'}
                        />
                      </span>
                    </div>

                    {/* Task description */}
                    {info.taskName && (
                      <p
                        className="text-[11px] leading-tight font-mono"
                        style={{ color: PARCHMENT.text }}
                      >
                        {info.taskName}
                      </p>
                    )}

                    {/* Current tool activity */}
                    {info.toolName && (
                      <div
                        className="flex items-center gap-1 text-[10px] font-mono"
                        style={{ color: '#5B8C3E' }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
                          style={{ backgroundColor: '#5B8C3E' }}
                        />
                        <span className="truncate">
                          {info.toolName === 'thinking' ? 'Thinking...' : (
                            <>
                              <span className="font-semibold">{info.toolName}</span>
                              {info.toolDetail && (
                                <span style={{ color: PARCHMENT.textDim }}>
                                  ({info.toolDetail})
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Git branch */}
                    {info.gitBranch && (
                      <div
                        className="text-[9px] font-mono truncate"
                        style={{ color: PARCHMENT.textDim }}
                      >
                        &#x2387; {info.gitBranch}
                      </div>
                    )}

                    {/* Subagent chips */}
                    {info.subagentNames.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {info.subagentNames.slice(0, 4).map((name) => (
                          <span
                            key={name}
                            className="text-[9px] font-mono px-1 py-0.5 rounded-sm"
                            style={{
                              backgroundColor: '#5B8C3E20',
                              color: '#3D6B26',
                              border: '1px solid #5B8C3E30',
                            }}
                          >
                            {name}
                          </span>
                        ))}
                        {info.subagentNames.length > 4 && (
                          <span
                            className="text-[9px] font-mono"
                            style={{ color: PARCHMENT.textDim }}
                          >
                            +{info.subagentNames.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick actions for waiting */}
                    {isWaiting && info.paneId && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuickActions
                          paneId={info.paneId}
                          sessionStatus={info.sessionStatus!}
                          terminalApp={info.terminalApp as any}
                        />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Idle empty state — when nobody is working */}
      {agentData.active.length === 0 && (
        <>
          <ParchmentDivider />
          <IdleEmptyState />
        </>
      )}

      {/* Slacking off — collapsible, compact */}
      {agentData.inactive.length > 0 && (
        <>
          <ParchmentDivider ornament />

          {/* Collapsible header */}
          <button
            type="button"
            className="w-full flex items-center gap-1.5 py-0.5 cursor-pointer"
            onClick={() => setOffDutyExpanded((v) => !v)}
            style={{ background: 'none', border: 'none' }}
          >
            {offDutyExpanded
              ? <ChevronDown className="h-3 w-3" style={{ color: PARCHMENT.textDim }} />
              : <ChevronRight className="h-3 w-3" style={{ color: PARCHMENT.textDim }} />}
            <Fish className="h-3 w-3" style={{ color: PARCHMENT.textDim }} />
            <span
              className="text-[10px] font-bold font-mono uppercase tracking-wider"
              style={{ color: PARCHMENT.textDim }}
            >
              Loafing
            </span>
            <span
              className="text-[9px] font-bold font-mono px-1.5 py-0.5 leading-none"
              style={{
                backgroundColor: `${PARCHMENT.accent}20`,
                color: PARCHMENT.accent,
                borderRadius: '2px',
              }}
            >
              {agentData.inactive.length}
            </span>
          </button>

          {/* Collapsed: compact dot grid */}
          {!offDutyExpanded && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {agentData.inactive.map(({ agent, lastActivity }) => (
                <button
                  key={agent.agentName}
                  type="button"
                  className="flex items-center gap-1 px-1.5 py-1 font-mono cursor-pointer transition-colors"
                  style={{
                    backgroundColor: PARCHMENT.card,
                    borderRadius: '2px',
                    border: `1px solid ${PARCHMENT.border}40`,
                  }}
                  onClick={() => onSelectAgent?.(agent.agentName)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PARCHMENT.cardHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = PARCHMENT.card;
                  }}
                  aria-label={`View ${agent.agentName} details`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: agent.color, opacity: 0.6 }}
                  />
                  <span className="text-[10px]" style={{ color: PARCHMENT.text }}>
                    {agent.agentName}
                  </span>
                  {lastActivity && (
                    <span className="text-[8px] tabular-nums" style={{ color: PARCHMENT.textDim }}>
                      {timeAgo(lastActivity)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Expanded: grouped by team */}
          {offDutyExpanded && (() => {
            const teamGroups: Record<string, typeof agentData.inactive> = {};
            for (const item of agentData.inactive) {
              const team = item.team ?? 'Other';
              if (!teamGroups[team]) teamGroups[team] = [];
              teamGroups[team].push(item);
            }
            const teamOrder = ['Engineering', 'Product', 'Growth', 'Operations', 'Other'];
            const sortedTeams = Object.keys(teamGroups).sort(
              (a, b) => (teamOrder.indexOf(a) === -1 ? 99 : teamOrder.indexOf(a)) - (teamOrder.indexOf(b) === -1 ? 99 : teamOrder.indexOf(b)),
            );

            return (
              <div className="space-y-1.5">
                {sortedTeams.map((teamName) => (
                  <div key={teamName} className="space-y-1">
                    <div className="flex items-center gap-1.5 px-1 py-0.5">
                      <Users className="h-2.5 w-2.5" style={{ color: PARCHMENT.accent }} />
                      <span
                        className="text-[9px] font-bold font-mono uppercase tracking-wider"
                        style={{ color: PARCHMENT.accent }}
                      >
                        {teamName}
                      </span>
                    </div>

                    {teamGroups[teamName].map(({ agent, status, lastFeature, lastActivity, fullRole, sessionCount }) => (
                      <button
                        key={agent.agentName}
                        type="button"
                        className="w-full text-left p-0 transition-all cursor-pointer"
                        style={{
                          ...PIXEL_CARD,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onClick={() => onSelectAgent?.(agent.agentName)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = PARCHMENT.cardHover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = PARCHMENT.card;
                        }}
                        aria-label={`View ${agent.agentName} details`}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5"
                          style={{
                            backgroundColor: agent.color,
                            opacity: status === 'idle' ? 0.6 : 0.25,
                          }}
                        />

                        <div className="pl-2.5 pr-2 py-1.5 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-sm shrink-0"
                              style={{
                                backgroundColor: agent.color,
                                opacity: status === 'idle' ? 0.6 : 0.25,
                              }}
                            />
                            <span
                              className="text-[11px] font-semibold font-mono truncate"
                              style={{ color: PARCHMENT.text }}
                            >
                              {agent.agentName}
                            </span>
                            <span
                              className="text-[9px] font-mono truncate"
                              style={{ color: PARCHMENT.textDim }}
                            >
                              {fullRole ?? agent.agentRole}
                            </span>
                            {lastActivity && (
                              <span
                                className="text-[9px] font-mono tabular-nums shrink-0 ml-auto"
                                style={{ color: PARCHMENT.textDim }}
                              >
                                {timeAgo(lastActivity)}
                              </span>
                            )}
                          </div>

                          {lastFeature && (
                            <div
                              className="text-[10px] font-mono truncate pl-3.5"
                              style={{ color: PARCHMENT.textDim }}
                            >
                              Last: {lastFeature}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
