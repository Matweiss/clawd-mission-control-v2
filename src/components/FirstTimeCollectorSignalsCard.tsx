import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, ShieldCheck, Sparkles, Target } from 'lucide-react';

type FirstTimeSignals = {
  firstTimeCollectors: number;
  repeatCollectors: number;
  conversionPressure: number;
  strongestSegment: Array<{ id: number; name: string; spent: number; daysSinceTouch: number | null }>;
  recommendation: string;
};

type ApiResponse = { firstTimeSignals: FirstTimeSignals };

export function FirstTimeCollectorSignalsCard() {
  const [data, setData] = useState<FirstTimeSignals | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/art/shopify-signals');
      const json: ApiResponse = await res.json();
      if (!res.ok) throw new Error('Failed');
      setData(json.firstTimeSignals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-pink-300" />
          <div>
            <h2 className="text-sm font-semibold text-white">First-time collector signals</h2>
            <p className="text-xs text-gray-500">Derived from live Shopify customer behavior</p>
          </div>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="p-4 space-y-4">
        {loading && !data ? <div className="text-sm text-gray-500">Loading first-time collector signals…</div> : data ? <>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric icon={Mail} label="First-time collectors" value={String(data.firstTimeCollectors)} sub="single-order buyers" />
            <Metric icon={Target} label="Conversion pressure" value={String(data.conversionPressure)} sub="quiet 14 to 60 days" />
            <Metric icon={ShieldCheck} label="Repeat collector base" value={String(data.repeatCollectors)} sub="proof of collector loyalty" />
          </div>
          <div className="rounded-lg border border-pink-500/20 bg-pink-500/10 p-3">
            <div className="flex items-center gap-2 text-xs text-pink-200 font-medium uppercase tracking-wide mb-2"><Sparkles className="w-4 h-4" />Best next move</div>
            <p className="text-sm text-white">{data.recommendation}</p>
          </div>
          <div className="space-y-2">
            {data.strongestSegment.map((collector) => (
              <div key={collector.id} className="rounded-lg border border-border bg-surface-light p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white">{collector.name}</div>
                  <div className="text-xs text-gray-400">{collector.daysSinceTouch ?? '—'}d since last touch</div>
                </div>
                <div className="text-sm text-pink-200">${Math.round(collector.spent).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </> : <div className="text-sm text-red-300">Signal data unavailable.</div>}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: any) {
  return <div className="rounded-lg border border-border bg-surface-light p-3"><div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Icon className="w-3.5 h-3.5" />{label}</div><div className="text-sm font-semibold text-white">{value}</div><div className="text-xs text-gray-400 mt-1">{sub}</div></div>;
}
