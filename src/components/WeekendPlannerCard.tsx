import React, { useEffect, useState } from 'react';
import { CalendarHeart, Film, MapPin, ExternalLink, RefreshCw } from 'lucide-react';

interface PlannerSuggestion {
  title: string;
  subtitle: string;
  time: string;
  location: string;
  reason: string;
  actionLabel: string;
  actionUrl: string;
}

interface WeekendPlannerData {
  generatedAt: string;
  timeframeLabel: string;
  movie: PlannerSuggestion;
  activity: PlannerSuggestion;
}

export function WeekendPlannerCard() {
  const [data, setData] = useState<WeekendPlannerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlanner = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lifestyle/weekend-planner');
      if (!res.ok) throw new Error('Failed to load weekend planner');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Weekend planner error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanner();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-surface-light" />
          <div className="h-20 rounded bg-surface-light" />
          <div className="h-20 rounded bg-surface-light" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { key: 'movie', label: 'Movie', icon: <Film className="w-4 h-4" />, accent: 'text-pink-300 bg-pink-500/10 border-pink-500/20', item: data.movie },
    { key: 'activity', label: 'Activity', icon: <CalendarHeart className="w-4 h-4" />, accent: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20', item: data.activity },
  ] as const;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Weekend Planner</h2>
          <p className="text-xs text-gray-500">{data.timeframeLabel} for Mat + Sarah</p>
        </div>
        <button onClick={fetchPlanner} className="text-xs text-work hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      <div className="p-4 space-y-3">
        {cards.map(({ key, label, icon, accent, item }) => (
          <div key={key} className={`rounded-xl border p-3 ${accent}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-80 mb-1">
                  {icon}
                  <span>{label}</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs opacity-80 mt-1">{item.subtitle}</p>
              </div>
              <button
                onClick={() => window.open(item.actionUrl, '_blank')}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                {item.actionLabel}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs text-gray-300">
              <div>{item.time}</div>
              <div className="inline-flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{item.location}</span>
              </div>
              <p className="text-gray-400">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
