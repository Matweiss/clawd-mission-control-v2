import React, { useEffect, useState } from 'react';
import { ArrowRight, Brush, CalendarClock, CheckSquare, HeartHandshake, Mail, Palette, ShieldCheck, Sparkles, Star, Users, RefreshCw } from 'lucide-react';

type SignalsResponse = {
  lastUpdated: string;
  heroStats: Array<{ label: string; value: string }>;
  collectorPulse: string[];
  studioPriorities: string[];
  launchRhythm: string[];
  inboxFraming: { summary: string; cues: string[] };
};

export function SarahHeroLive() {
  const [data, setData] = useState<SignalsResponse | null>(null);

  useEffect(() => { fetch('/api/art/shopify-signals').then(r => r.json()).then(setData).catch(() => {}); }, []);

  const stats = data?.heroStats || [
    { label: '30d revenue', value: 'Loading…' },
    { label: 'new subscribers', value: 'Loading…' },
    { label: 'active works', value: 'Loading…' },
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-rose-300/20 bg-gradient-to-br from-[#3a1823] via-[#17141f] to-[#120f17] p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.14),transparent_24%)]" />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-rose-100/80"><Palette className="w-3.5 h-3.5" />Sarah J. Schwartz Fine Art</div>
          <h1 className="mt-4 text-3xl lg:text-5xl font-semibold tracking-tight text-white max-w-3xl">A collector-first workspace for launches, relationships, and studio follow-through.</h1>
          <p className="mt-4 max-w-2xl text-sm lg:text-base leading-7 text-rose-50/75">Built to help Sarah protect the warmth of the brand while making launches, sold-piece updates, inbox review, and collector follow-up feel calm and beautifully organized.</p>
          <div className="mt-6 flex flex-wrap gap-3"><div className="inline-flex items-center gap-2 rounded-full bg-rose-400/15 px-4 py-2 text-sm text-rose-100"><HeartHandshake className="w-4 h-4" />Human-in-the-loop always</div><div className="inline-flex items-center gap-2 rounded-full bg-amber-300/10 px-4 py-2 text-sm text-amber-100"><Brush className="w-4 h-4" />Live store signals from Shopify</div></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-rose-100/70 mb-4"><Sparkles className="w-4 h-4" />Live store posture</div>
          <div className="space-y-3">{stats.map((stat) => <div key={stat.label} className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"><div className="text-[11px] uppercase tracking-[0.18em] text-rose-100/55">{stat.label}</div><div className="mt-1 text-sm text-white">{stat.value}</div></div>)}</div>
        </div>
      </div>
    </div>
  );
}

export function CollectorPulseLiveCard() {
  return <SignalListCard title="Collector pulse" icon={Users} endpointKey="collectorPulse" iconClass="text-amber-300" />;
}
export function StudioPrioritiesLiveCard() {
  return <SignalListCard title="Studio priorities" icon={CheckSquare} endpointKey="studioPriorities" iconClass="text-rose-300" />;
}
export function LaunchRhythmLiveCard() {
  return <SignalListCard title="Launch rhythm" icon={CalendarClock} endpointKey="launchRhythm" iconClass="text-amber-200" />;
}
export function InboxFramingLiveCard() {
  const [data, setData] = useState<SignalsResponse | null>(null);
  useEffect(() => { fetch('/api/art/shopify-signals').then(r => r.json()).then(setData).catch(() => {}); }, []);
  return <div className="rounded-2xl border border-stone-700/60 bg-[#17141a] p-5"><div className="flex items-center gap-2 mb-4"><Mail className="w-4 h-4 text-pink-300" /><h2 className="text-sm font-semibold text-white">Collector communications</h2></div><p className="text-sm leading-6 text-stone-300">{data?.inboxFraming?.summary || 'Loading live inbox framing from Shopify order and collector signals…'}</p><div className="mt-3 space-y-2">{(data?.inboxFraming?.cues || []).map((cue) => <div key={cue} className="flex items-start gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-3 text-sm text-stone-300"><ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-rose-300" /><span>{cue}</span></div>)}</div></div>;
}

function SignalListCard({ title, icon: Icon, endpointKey, iconClass }: any) {
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { setLoading(true); const res = await fetch('/api/art/shopify-signals'); setData(await res.json()); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const items = (data as any)?.[endpointKey] || [];
  return <div className="rounded-2xl border border-stone-700/60 bg-[#17141a] p-5"><div className="flex items-center gap-2 mb-4"><Icon className={`w-4 h-4 ${iconClass}`} /><h2 className="text-sm font-semibold text-white">{title}</h2><button onClick={load} className="ml-auto text-gray-400 hover:text-white"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button></div><div className="space-y-2">{items.map((item: string) => <div key={item} className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5 text-sm text-stone-200">{item}</div>)}{!items.length && <div className="text-sm text-stone-400">Loading live Shopify signals…</div>}</div></div>;
}
