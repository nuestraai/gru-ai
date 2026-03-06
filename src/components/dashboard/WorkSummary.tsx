import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/stores/dashboard-store';
import {
  Target,
  Layers,
  ListChecks,
  ArrowRight,
  CircleDot,
} from 'lucide-react';
import type { FeatureRecord } from '@/stores/types';

export default function WorkSummary() {
  const workState = useDashboardStore((s) => s.workState);
  const navigate = useNavigate();

  const summary = useMemo(() => {
    if (!workState?.features) return null;

    const features = workState.features?.features ?? [];
    const backlogs = workState.backlogs?.items ?? [];
    const directives = workState.conductor?.directives ?? [];

    const inProgressFeatures = features.filter((f: FeatureRecord) => f.status === 'in_progress');
    const pendingFeatures = features.filter((f: FeatureRecord) => f.status === 'pending');
    const doneFeatures = features.filter((f: FeatureRecord) => f.status === 'completed');
    const totalBacklog = backlogs.length;
    const actionableBacklog = backlogs.filter(b => b.status === 'pending' || b.status === 'in_progress' || b.status === 'blocked').length;

    // Top categories by active feature count
    const categoryFeatureCount: Record<string, number> = {};
    for (const f of [...inProgressFeatures, ...pendingFeatures]) {
      const cat = f.category ?? 'uncategorized';
      categoryFeatureCount[cat] = (categoryFeatureCount[cat] ?? 0) + 1;
    }
    const topCategories = Object.entries(categoryFeatureCount)
      .map(([category, activeCount]) => ({
        category,
        activeCount,
        backlogCount: backlogs.filter(b => (b.category ?? 'uncategorized') === category).length,
      }))
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 5);

    const activeDirectiveCount = directives.filter(d => d.status === 'in_progress').length;

    return {
      activeDirectives: activeDirectiveCount,
      totalDirectives: directives.length,
      inProgress: inProgressFeatures.length,
      pending: pendingFeatures.length,
      done: doneFeatures.length,
      backlog: totalBacklog,
      actionableBacklog,
      topCategories,
    };
  }, [workState]);

  if (!summary) return null;

  return (
    <div>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">
        Work Overview
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Summary stats */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center gap-2 text-left hover:bg-secondary/50 rounded p-1 -m-1 transition-colors cursor-pointer" onClick={() => navigate('/directives')}>
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{summary.activeDirectives}</p>
                  <p className="text-[10px] text-muted-foreground">Active Directives</p>
                </div>
              </button>
              <button className="flex items-center gap-2 text-left hover:bg-secondary/50 rounded p-1 -m-1 transition-colors cursor-pointer" onClick={() => navigate('/directives')}>
                <CircleDot className="h-4 w-4 text-status-yellow" />
                <div>
                  <p className="text-lg font-bold">{summary.inProgress + summary.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Open Features</p>
                </div>
              </button>
              <button className="flex items-center gap-2 text-left hover:bg-secondary/50 rounded p-1 -m-1 transition-colors cursor-pointer" onClick={() => navigate('/directives')}>
                <Layers className="h-4 w-4 text-status-green" />
                <div>
                  <p className="text-lg font-bold">{summary.done}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
              </button>
              <button className="flex items-center gap-2 text-left hover:bg-secondary/50 rounded p-1 -m-1 transition-colors cursor-pointer" onClick={() => navigate('/directives')}>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold">{summary.actionableBacklog}<span className="text-sm font-normal text-muted-foreground">/{summary.backlog}</span></p>
                  <p className="text-[10px] text-muted-foreground">Backlog Active</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {summary.topCategories.map((cat) => (
                <button
                  key={cat.category}
                  className="flex items-center gap-2 w-full text-left hover:bg-secondary/50 rounded px-2 py-1 -mx-2 transition-colors cursor-pointer"
                  onClick={() => navigate('/projects')}
                >
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs truncate flex-1">{cat.category.replace(/-/g, ' ')}</span>
                  {cat.activeCount > 0 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-status-yellow/10 text-status-yellow border-status-yellow/30">
                      {cat.activeCount} active
                    </Badge>
                  )}
                  {cat.backlogCount > 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      {cat.backlogCount} backlog
                    </span>
                  )}
                </button>
              ))}
              {summary.topCategories.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No active work</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
