import { useEffect, useState } from 'react';
import type { PlanEntry } from '@/stores/types';
import PlanViewer from './PlanViewer';

const API_BASE = `http://${window.location.hostname}:4444`;

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/insights/plans`)
      .then((r) => r.json())
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PlanViewer plans={plans} />
    </div>
  );
}
