// ---------------------------------------------------------------------------
// ToolCallLog — shared streaming tool-call log component + hook
// ---------------------------------------------------------------------------

import { useRef, useEffect, useCallback } from 'react';
import type { SessionActivity } from '@/stores/types';

// ---------------------------------------------------------------------------
// Types and constants
// ---------------------------------------------------------------------------

const RING_BUFFER_CAP = 50;

export interface ToolCallEntry {
  id: string;
  timestamp: string;
  tool: string;
  detail?: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// useToolCallBuffer — ring buffer that diffs sessionActivities per session
// ---------------------------------------------------------------------------

export function useToolCallBuffer(
  sessionIds: string[],
  sessionActivities: Record<string, SessionActivity>,
) {
  const bufferRef = useRef<Map<string, ToolCallEntry[]>>(new Map());
  const prevRef = useRef<Record<string, SessionActivity>>({});
  const counterRef = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;

    for (const sessionId of sessionIds) {
      const activity = sessionActivities[sessionId];
      if (!activity || !activity.active) continue;

      const prevAct = prev[sessionId];
      const changed =
        !prevAct ||
        prevAct.tool !== activity.tool ||
        prevAct.detail !== activity.detail ||
        prevAct.thinking !== activity.thinking;

      if (!changed) continue;

      const tool = activity.thinking ? 'Thinking' : activity.tool;
      if (!tool) continue;

      const entry: ToolCallEntry = {
        id: `tc-${sessionId}-${++counterRef.current}`,
        timestamp: activity.lastSeen || new Date().toISOString(),
        tool,
        detail: activity.detail ?? undefined,
        sessionId,
      };

      const existing = bufferRef.current.get(sessionId) ?? [];
      existing.push(entry);
      if (existing.length > RING_BUFFER_CAP) {
        existing.splice(0, existing.length - RING_BUFFER_CAP);
      }
      bufferRef.current.set(sessionId, existing);
    }

    prevRef.current = { ...sessionActivities };
  }, [sessionActivities, sessionIds]);

  return bufferRef;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOOL_COLORS: Record<string, string> = {
  edit: '#EAB308',
  write: '#EAB308',
  read: '#3B82F6',
  bash: '#22C55E',
  grep: '#A855F7',
  glob: '#A855F7',
  task: '#F97316',
  agent: '#F97316',
  thinking: '#6B7280',
};

function toolColor(tool: string): string {
  return TOOL_COLORS[tool.toLowerCase()] ?? '#9CA3AF';
}

function shortDetail(detail?: string): string {
  if (!detail) return '';
  const parts = detail.split('/');
  if (parts.length > 2) {
    return `.../${parts.slice(-2).join('/')}`;
  }
  return detail.length > 50 ? detail.slice(0, 47) + '...' : detail;
}

// ---------------------------------------------------------------------------
// ToolCallLog component
// ---------------------------------------------------------------------------

interface ToolCallLogProps {
  entries: ToolCallEntry[];
  maxHeight?: string;
  compact?: boolean;
}

export default function ToolCallLog({ entries, maxHeight = '120px', compact }: ToolCallLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    userScrolledRef.current = !atBottom;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && !userScrolledRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) return null;

  const fontSize = compact ? 'text-[9px] leading-[14px]' : 'text-[10px] leading-[16px]';

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="overflow-y-auto overflow-x-hidden"
      style={{
        maxHeight,
        backgroundColor: '#1E1E1E',
        borderRadius: '2px',
        padding: compact ? '2px 4px' : '4px 6px',
        boxShadow: [
          'inset 1px 1px 0 0 #111',
          'inset -1px -1px 0 0 #333',
          '0 0 0 1px #A08040',
        ].join(', '),
      }}
    >
      {entries.map((entry) => {
        const color = toolColor(entry.tool);
        const detail = shortDetail(entry.detail);
        return (
          <div
            key={entry.id}
            className={`flex items-baseline gap-1 ${fontSize} font-mono`}
            style={{ color: '#A0A0A0' }}
          >
            <span style={{ color: '#555' }}>$</span>
            <span className="font-semibold shrink-0" style={{ color }}>
              {entry.tool}
            </span>
            {detail && (
              <span className="truncate min-w-0" style={{ color: '#8A8A8A' }}>
                {detail}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
