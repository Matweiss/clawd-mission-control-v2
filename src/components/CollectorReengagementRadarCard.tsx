import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock3, MessageCircleHeart, RefreshCw, Sparkles, Star } from 'lucide-react';

type RadarCollector = {
  name: string;
  segment: string;
  lifetimeOrders: number;
  lifetimeSpend: number;
  lastPurchaseDate: string;
  lastTouchDate?: string;
  favoriteThemes?: string[];
  notes?: string;
  reasons?: string[];
  recommendedAction?: string;
  priority: 'high' | 'medium' | 'low';
  daysSincePurchase: number | null;
  daysSinceTouch: number | null;
  score: number;
};

type RadarResponse = {
  lastUpdated: string;
  totals: {
    totalCollectors: number;
    highPriority: number;
    vipAtRisk: number;
    avgDaysSincePurchase: number;
  };
  collectors: RadarCollector[];
  topRecommendation: string | null;
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export function CollectorReengagementRadarCard() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/art/collector-reengagement');
      if (!response.ok) throw new Error('Failed to load radar');
      setData(await response.json());
    } catch (error) {
      console.error('Failed to load collector radar', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const topCollectors = data?.collectors.slice(0, 3) || [];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <MessageCircleHeart className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">TMW-72 • Collector Re-engagement Radar</h2>
              <p className="text-xs text-gray-500">Surface lapsed collectors who deserve a personal Sarah touch</p>
            </div>
          </div>
          <button onClick={loadData} className="text-gray-400 hover:text-white" aria-label="Refresh collector radar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading && !data ? (
          <div className="text-sm text-gray-500">Loading collector radar…</div>
        ) : !data ? (
          <div className="text-sm text-red-300">Collector radar unavailable.</div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Flagged" value={String(data.totals.totalCollectors)} sub="lapsed collectors on deck" />
              <Metric label="High priority" value={String(data.totals.highPriority)} sub="worth personal outreach now" />
              <Metric label="VIP at risk" value={String(data.totals.vipAtRisk)} sub="high-value relationships" />
              <Metric label="Avg lapse" value={`${data.totals.avgDaysSincePurchase}d`} sub="since last purchase" />
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-200 font-medium uppercase tracking-wide mb-2">
                <Sparkles className="w-4 h-4" />
                Best next move
              </div>
              <p className="text-sm text-white">{data.topRecommendation || 'No recommendation available yet.'}</p>
            </div>

            <div className="space-y-3">
              {topCollectors.map((collector) => (
                <div key={collector.name} className="rounded-lg border border-border bg-surface-light p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{collector.name}</h3>
                        <span className={`text-[10px] uppercase tracking-[0.18em] ${collector.priority === 'high' ? 'text-red-300' : 'text-yellow-300'}`}>
                          {collector.priority}
                        </span>
                        {collector.segment.toLowerCase() === 'vip' && <Star className="w-3.5 h-3.5 text-amber-300" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {collector.segment} • {collector.lifetimeOrders} orders • {currency(collector.lifetimeSpend)} lifetime
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <div>Score {collector.score}</div>
                      <div>{collector.daysSincePurchase ?? '—'}d since purchase</div>
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3 text-xs mb-3">
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide mb-1">Why now</p>
                      <ul className="space-y-1 text-gray-300">
                        {(collector.reasons || []).slice(0, 2).map((reason) => (
                          <li key={reason}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide mb-1">Suggested angle</p>
                      <p className="text-gray-300">{collector.recommendedAction}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase tracking-wide mb-1">Taste cues</p>
                      <div className="flex flex-wrap gap-2">
                        {(collector.favoriteThemes || []).map((theme) => (
                          <span key={theme} className="px-2 py-1 rounded-full bg-black/20 border border-white/5 text-[11px] text-gray-300">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <Clock3 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{collector.daysSinceTouch ?? '—'}d since personal touch. {collector.notes}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-surface-light p-3">
              <div className="flex items-center gap-2 mb-2 text-xs text-rose-200 font-medium uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                Guardrail
              </div>
              <p className="text-sm text-white">Use this as a human outreach queue, not automation. The brand move is a personal note, first-look share, or styling check-in from Sarah.</p>
              <p className="text-xs text-gray-500 mt-2">Last updated {data.lastUpdated}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-light p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}
