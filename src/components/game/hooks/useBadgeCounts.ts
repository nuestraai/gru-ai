// ---------------------------------------------------------------------------
// useBadgeCounts — computes notification badge counts per HUD tab
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import { useDashboardStore } from '@/stores/dashboard-store';

export interface BadgeCounts {
  team: number;
  tasks: number;
  ops: number;
  log: number;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

function isRecent(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < ONE_HOUR_MS;
}

/**
 * Reads dashboard store and computes badge counts for each HUD tab.
 *
 * Badge rules:
 * - Team: agents in waiting-approval, waiting-input, or error state
 * - Tasks: errors + waiting-approval sessions + awaiting_completion directives + pipeline steps needing action
 * - Ops: blocked/failing projects
 * - Log: never shows a badge
 */
export function useBadgeCounts(): BadgeCounts {
  const sessions = useDashboardStore((s) => s.sessions);
  const directiveState = useDashboardStore((s) => s.directiveState);
  const activeDirectives = useDashboardStore((s) => s.activeDirectives);
  const workState = useDashboardStore((s) => s.workState);

  return useMemo(() => {
    // -- Team badge: agents needing attention (waiting-approval, waiting-input, error) --
    let team = 0;
    for (const s of sessions) {
      if (s.isSubagent || s.status === 'done') continue;
      if (
        (s.status === 'waiting-approval' || s.status === 'waiting-input' || s.status === 'error') &&
        isRecent(s.lastActivity)
      ) {
        team++;
      }
    }

    // -- Tasks badge: session items + directive items --
    let tasks = 0;
    for (const s of sessions) {
      if (s.isSubagent || s.status === 'done') continue;
      if (s.status === 'error' && isRecent(s.lastActivity)) {
        tasks++;
      } else if (s.status === 'waiting-approval' && isRecent(s.lastActivity)) {
        tasks++;
      }
    }
    // Count from activeDirectives if available, otherwise fall back to singular
    const directives = activeDirectives && activeDirectives.length > 0
      ? activeDirectives
      : directiveState ? [directiveState] : [];
    for (const d of directives) {
      if (d.status === 'awaiting_completion') {
        tasks++;
      } else if (d.pipelineSteps) {
        for (const step of d.pipelineSteps) {
          if (step.needsAction) {
            tasks++;
            break;
          }
        }
      }
    }

    // -- Ops badge: blocked or failing projects --
    let ops = 0;
    const features = workState?.features?.features;
    if (features) {
      for (const f of features) {
        if (f.status === 'blocked') {
          ops++;
        }
      }
    }

    // -- Log badge: never shows --
    const log = 0;

    return { team, tasks, ops, log };
  }, [sessions, directiveState, activeDirectives, workState]);
}
