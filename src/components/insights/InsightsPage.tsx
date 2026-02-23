import { useEffect, useState } from 'react';
import type { StatsCache } from '@/stores/types';
import UsageStats from './UsageStats';

const API_BASE = `http://${window.location.hostname}:4444`;

export default function InsightsPage() {
  const [stats, setStats] = useState<StatsCache | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/insights/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <UsageStats stats={stats} />
    </div>
  );
}
