import { useCallback, useEffect, useState } from 'react';

interface QuickStatsData {
  yogaClasses: number;
  watchlistCount: number;
  buddyPasses: number;
  buddyPassDays: number;
  pipelineMRR: string;
  pipelineARR: string;
}

const DEFAULT_QUICK_STATS: QuickStatsData = {
  yogaClasses: 0,
  watchlistCount: 0,
  buddyPasses: 0,
  buddyPassDays: 0,
  pipelineMRR: '—',
  pipelineARR: '—',
};

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value)}`;
}

function daysUntil(dateString?: string) {
  if (!dateString) return 0;
  const target = new Date(`${dateString}T23:59:59-08:00`).getTime();
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function useQuickStats() {
  const [data, setData] = useState<QuickStatsData>(DEFAULT_QUICK_STATS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [yogaRes, watchlistRes, pipelineRes] = await Promise.all([
        fetch('/api/yoga/stats').catch(() => null),
        fetch('/api/movies/watchlist').catch(() => null),
        fetch('/api/pipeline/summary').catch(() => null),
      ]);

      const [yoga, watchlist, pipeline] = await Promise.all([
        yogaRes?.ok ? yogaRes.json() : null,
        watchlistRes?.ok ? watchlistRes.json() : null,
        pipelineRes?.ok ? pipelineRes.json() : null,
      ]);

      const totalMRR = typeof pipeline?.totalMRR === 'number' ? pipeline.totalMRR : 0;

      setData({
        yogaClasses: typeof yoga?.totalClasses === 'number' ? yoga.totalClasses : 0,
        watchlistCount: typeof watchlist?.watchlistCount === 'number' ? watchlist.watchlistCount : 0,
        buddyPasses: typeof yoga?.buddyPasses === 'number' ? yoga.buddyPasses : 0,
        buddyPassDays: daysUntil(yoga?.buddyPassExpiry),
        pipelineMRR: totalMRR ? formatMoney(totalMRR) : pipeline?.totalValue || '—',
        pipelineARR: totalMRR ? formatMoney(totalMRR * 12) : '—',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, refresh };
}
