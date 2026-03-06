// ---------------------------------------------------------------------------
// OpsPanel — KPI strip + Category health cards (2-level: Categories -> Projects)
// ---------------------------------------------------------------------------

import { useState, useMemo, useCallback } from 'react';
import { Target, FolderOpen, TrendingUp, Layers, ClipboardList, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboard-store';
import type { FeatureRecord, BacklogRecord, LifecycleState } from '@/stores/types';
import {
  SectionHeader, PixelProgress, ParchmentDivider,
  PIXEL_CARD, PIXEL_CARD_RAISED, PARCHMENT,
} from './panelUtils';

// ---------------------------------------------------------------------------
// Status badge (carried from ProjectsPanel)
// ---------------------------------------------------------------------------

function lifecycleBadge(status: LifecycleState): { bg: string; text: string; label: string } {
  switch (status) {
    case 'in_progress': return { bg: '#22C55E', text: '#052E16', label: 'Active' };
    case 'completed':   return { bg: '#3B82F6', text: '#fff', label: 'Done' };
    case 'pending':     return { bg: '#9CA3AF', text: '#1F2937', label: 'Pending' };
    case 'blocked':     return { bg: '#EF4444', text: '#fff', label: 'Blocked' };
    case 'deferred':    return { bg: '#F59E0B', text: '#422006', label: 'Deferred' };
    case 'abandoned':   return { bg: '#6B7280', text: '#fff', label: 'Dropped' };
    default:            return { bg: '#9CA3AF', text: '#1F2937', label: String(status) };
  }
}

function StatusBadge({ status }: { status: LifecycleState }) {
  const { bg, text, label } = lifecycleBadge(status);
  return (
    <span
      className="text-[9px] font-bold font-mono px-1.5 py-0.5 leading-none shrink-0"
      style={{
        backgroundColor: bg,
        color: text,
        borderRadius: '2px',
        boxShadow: `0 1px 0 0 ${bg}80`,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Category health color (based on project statuses under that category)
// ---------------------------------------------------------------------------

function goalHealthColor(features: FeatureRecord[]): string {
  if (features.length === 0) return '#9CA3AF'; // gray — no projects
  const hasBlocked = features.some((f) => f.status === 'blocked');
  if (hasBlocked) return '#EF4444'; // red
  const activeCount = features.filter((f) => f.status === 'in_progress').length;
  const doneCount = features.filter((f) => f.status === 'completed').length;
  if (doneCount === features.length) return '#3B82F6'; // blue — all done
  if (activeCount > 0) return '#22C55E'; // green — work in progress
  return '#F59E0B'; // yellow — pending / deferred
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="p-2" style={PIXEL_CARD}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="flex items-center" style={{ color }} aria-hidden="true">
          {icon}
        </span>
        <span
          className="text-[9px] font-bold font-mono uppercase tracking-wider"
          style={{ color: PARCHMENT.textDim }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-lg font-bold font-mono tabular-nums leading-none"
          style={{ color: PARCHMENT.text }}
        >
          {value}
        </span>
        {sub && (
          <span
            className="text-[9px] font-mono"
            style={{ color: PARCHMENT.textDim }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI strip — 2x2 grid
// ---------------------------------------------------------------------------

function KpiStrip({
  activeCategories,
  activeProjects,
  backlogDepth,
  p0Count,
  completionRate,
}: {
  activeCategories: number;
  activeProjects: number;
  backlogDepth: number;
  p0Count: number;
  completionRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 mb-2">
      <KpiCard
        label="Categories"
        value={activeCategories}
        icon={<Target className="h-3 w-3" />}
        color="#22C55E"
      />
      <KpiCard
        label="Active Projects"
        value={activeProjects}
        icon={<FolderOpen className="h-3 w-3" />}
        color="#3B82F6"
      />
      <KpiCard
        label="Backlog"
        value={backlogDepth}
        sub={p0Count > 0 ? `${p0Count} P0` : undefined}
        icon={<ClipboardList className="h-3 w-3" />}
        color="#F59E0B"
      />
      <KpiCard
        label="Done (7d)"
        value={completionRate}
        sub={completionRate === 1 ? 'project' : 'projects'}
        icon={<TrendingUp className="h-3 w-3" />}
        color="#8B5CF6"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category health card (expandable)
// ---------------------------------------------------------------------------

function CategoryHealthCard({
  category,
  features,
  backlogCount,
}: {
  category: string;
  features: FeatureRecord[];
  backlogCount: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = features.filter((f) => f.status === 'in_progress').length;
  const blockedCount = features.filter((f) => f.status === 'blocked').length;
  const doneCount = features.filter((f) => f.status === 'completed').length;
  const healthColor = goalHealthColor(features);

  const totalProjects = features.length;
  const Chevron = expanded ? ChevronDown : ChevronRight;

  // Derive status from features
  const categoryStatus: LifecycleState = blockedCount > 0
    ? 'blocked'
    : activeCount > 0
    ? 'in_progress'
    : doneCount === totalProjects && totalProjects > 0
    ? 'completed'
    : 'pending';

  // Status one-liner
  const parts: string[] = [];
  if (activeCount > 0) parts.push(`${activeCount} active`);
  if (blockedCount > 0) parts.push(`${blockedCount} blocked`);
  if (doneCount > 0) parts.push(`${doneCount} done`);
  if (backlogCount > 0) parts.push(`${backlogCount} backlog`);
  const oneLiner = parts.join(', ') || 'No projects';

  const displayName = category.replace(/-/g, ' ');

  return (
    <div
      style={{
        ...PIXEL_CARD,
        borderLeft: `3px solid ${healthColor}`,
      }}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left p-2.5 transition-colors"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = PARCHMENT.cardHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
        aria-expanded={expanded}
        aria-label={`Category: ${displayName}, ${oneLiner}`}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[11px] font-bold font-mono truncate flex-1"
            style={{ color: PARCHMENT.text }}
          >
            {displayName}
          </span>
          <StatusBadge status={categoryStatus} />
          <Chevron
            className="h-3 w-3 shrink-0"
            style={{ color: PARCHMENT.textDim }}
            aria-hidden="true"
          />
        </div>

        {/* Progress bar */}
        {totalProjects > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <PixelProgress
              value={doneCount}
              max={totalProjects}
              color={healthColor}
              height={4}
            />
            <span
              className="text-[9px] font-mono tabular-nums shrink-0"
              style={{ color: PARCHMENT.textDim }}
            >
              {doneCount}/{totalProjects}
            </span>
          </div>
        )}

        {/* Status one-liner */}
        <span
          className="text-[9px] font-mono"
          style={{ color: PARCHMENT.textDim }}
        >
          {oneLiner}
        </span>
      </button>

      {/* Expanded: list of active/in-progress projects */}
      {expanded && features.length > 0 && (
        <div
          className="px-2.5 pb-2.5 space-y-1.5"
          style={{ borderTop: `1px solid ${PARCHMENT.border}40` }}
        >
          <div className="pt-1.5" />
          {features.map((feature) => {
            const progressColor = feature.status === 'completed' ? '#3B82F6' : '#5B8C3E';
            const pct = feature.taskCount > 0
              ? Math.round((feature.completedTaskCount / feature.taskCount) * 100)
              : 0;
            return (
              <div
                key={feature.id}
                className="p-2"
                style={{
                  backgroundColor: `${PARCHMENT.card}80`,
                  borderRadius: '2px',
                  boxShadow: `inset 0 0 0 1px ${PARCHMENT.border}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ color: PARCHMENT.accent }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[10px] font-bold font-mono truncate flex-1"
                    style={{ color: PARCHMENT.text }}
                  >
                    {feature.title}
                  </span>
                  <StatusBadge status={feature.status} />
                </div>
                <div className="flex items-center gap-2">
                  <PixelProgress
                    value={feature.completedTaskCount}
                    max={feature.taskCount}
                    color={progressColor}
                    height={4}
                  />
                  <span
                    className="text-[9px] font-mono tabular-nums shrink-0"
                    style={{ color: PARCHMENT.textDim }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded: no projects */}
      {expanded && features.length === 0 && (
        <div className="px-2.5 pb-2.5">
          <p
            className="text-[9px] font-mono text-center py-2"
            style={{ color: PARCHMENT.textDim }}
          >
            No projects under this category
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Backlog preview (top 3 P0 items)
// ---------------------------------------------------------------------------

function BacklogPreview({ items }: { items: BacklogRecord[] }) {
  const p0Items = useMemo(
    () => items.filter((b) => b.priority === 'P0').slice(0, 3),
    [items],
  );

  if (p0Items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <SectionHeader
        icon={<AlertCircle className="h-3 w-3" />}
        count={p0Items.length}
        color="#EF4444"
      >
        P0 Backlog
      </SectionHeader>

      {p0Items.map((item) => (
        <div key={item.id} className="p-2" style={PIXEL_CARD}>
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-bold font-mono px-1 py-0.5 leading-none shrink-0"
              style={{
                backgroundColor: '#EF4444',
                color: '#fff',
                borderRadius: '2px',
              }}
            >
              P0
            </span>
            <span
              className="text-[10px] font-bold font-mono truncate flex-1"
              style={{ color: PARCHMENT.text }}
            >
              {item.title}
            </span>
          </div>
          {item.description && (
            <p
              className="text-[9px] font-mono mt-1 truncate pl-6"
              style={{ color: PARCHMENT.textDim }}
            >
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OpsPanel() {
  const features = useDashboardStore((s) => s.workState?.features?.features ?? []);
  const backlogItems = useDashboardStore((s) => s.workState?.backlogs?.items ?? []);

  // --- KPI computations ---

  const activeProjects = useMemo(
    () => features.filter((f) => f.status === 'in_progress').length,
    [features],
  );

  const backlogDepth = backlogItems.length;

  const p0Count = useMemo(
    () => backlogItems.filter((b) => b.priority === 'P0').length,
    [backlogItems],
  );

  // Completion rate: features completed in last 7 days
  const completionRate = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return features.filter(
      (f) => f.status === 'completed' && new Date(f.updatedAt).getTime() >= sevenDaysAgo,
    ).length;
  }, [features]);

  // --- Features by category ---
  const featuresByCategory = useMemo(() => {
    const map: Record<string, FeatureRecord[]> = {};
    for (const f of features) {
      const cat = f.category ?? 'uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(f);
    }
    return map;
  }, [features]);

  // --- Backlog count by category ---
  const backlogCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of backlogItems) {
      const cat = b.category ?? 'uncategorized';
      map[cat] = (map[cat] ?? 0) + 1;
    }
    return map;
  }, [backlogItems]);

  // Unique categories sorted by active feature count desc
  const sortedCategories = useMemo(() => {
    const cats = Object.keys(featuresByCategory);
    return cats.sort((a, b) => {
      const aActive = featuresByCategory[a].filter((f) => f.status === 'in_progress').length;
      const bActive = featuresByCategory[b].filter((f) => f.status === 'in_progress').length;
      return bActive - aActive;
    });
  }, [featuresByCategory]);

  const activeCategories = sortedCategories.filter(
    cat => featuresByCategory[cat].some(f => f.status === 'in_progress')
  ).length;

  return (
    <div className="space-y-2">
      {/* KPI Strip */}
      <KpiStrip
        activeCategories={activeCategories}
        activeProjects={activeProjects}
        backlogDepth={backlogDepth}
        p0Count={p0Count}
        completionRate={completionRate}
      />

      <ParchmentDivider ornament />

      {/* Category Health Cards */}
      <SectionHeader
        icon={<Layers className="h-3 w-3" />}
        count={sortedCategories.length}
      >
        Category Health
      </SectionHeader>

      {sortedCategories.length === 0 ? (
        <div className="text-center py-6 font-mono" style={PIXEL_CARD}>
          <p className="text-[11px]" style={{ color: PARCHMENT.textDim }}>
            No categories found
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedCategories.map((cat) => (
            <CategoryHealthCard
              key={cat}
              category={cat}
              features={featuresByCategory[cat] ?? []}
              backlogCount={backlogCountByCategory[cat] ?? 0}
            />
          ))}
        </div>
      )}

      {/* Backlog preview — P0 items */}
      {p0Count > 0 && (
        <>
          <ParchmentDivider />
          <BacklogPreview items={backlogItems} />
        </>
      )}
    </div>
  );
}
