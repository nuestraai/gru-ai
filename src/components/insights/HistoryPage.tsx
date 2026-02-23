import { useEffect, useState } from 'react';
import type { PromptEntry } from '@/stores/types';
import PromptHistory from './PromptHistory';

const API_BASE = `http://${window.location.hostname}:4444`;

export default function HistoryPage() {
  const [entries, setEntries] = useState<PromptEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/insights/history`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PromptHistory entries={entries} />
    </div>
  );
}
