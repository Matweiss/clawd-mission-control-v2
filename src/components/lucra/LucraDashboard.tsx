import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock, MailPlus, RefreshCw, TimerReset, XCircle } from 'lucide-react';
import { PipelineSheetCard } from '../PipelineSheetCard';

type Prospect = {
  key: string;
  company: string;
  contactEmail: string;
  contactName?: string;
  subject?: string;
  stage?: string;
  lastContact?: string;
  nextAction?: string;
  nextActionDate?: string;
  threadId?: string;
  messageCount?: number;
};

type LucraState = {
  generatedAt?: string;
  summary?: { prospects?: number; dueToday?: number };
  due_today?: Prospect[];
  prospects?: Prospect[];
  error?: string;
};

function daysSince(date?: string) {
  if (!date) return 0;
  const then = new Date(`${date}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / 86400000));
}

function formatDateTime(value?: string) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function LucraDashboard({ pipelineARR }: { pipelineARR: number }) {
  const [data, setData] = useState<LucraState | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const due = data?.due_today || [];
  const recent = useMemo(() => (data?.prospects || []).filter(p => daysSince(p.lastContact) <= 14).slice(0, 8), [data]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lucra-tracker');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Failed to load Lucra tracker');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: string, prospect?: Prospect, extra: Record<string, unknown> = {}) => {
    setBusyKey(`${action}:${prospect?.key || 'scan'}`);
    setToast(null);
    try {
      const res = await fetch('/api/lucra-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, key: prospect?.key, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lucra action failed');
      if (action === 'draft-follow-up') setToast(`Draft created: ${json.draft?.id || 'ready'}`);
      if (action === 'snooze') setToast(`Snoozed until ${json.nextActionDate}`);
      if (action === 'mark-closed-lost') setToast('Marked closed-lost');
      if (action === 'run-scan') setToast('Lucra scan complete');
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyKey(null);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-slate-950 to-cyan-500/10 p-4 shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Lucra command surface</div>
            <h2 className="mt-1 text-2xl font-semibold text-white">Sales follow-up cockpit</h2>
          </div>
          <button onClick={() => runAction('run-scan')} disabled={!!busyKey} className="flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-sm text-orange-100 hover:bg-orange-400/20 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${busyKey === 'run-scan:scan' ? 'animate-spin' : ''}`} /> Run scan now
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="Pipeline ARR" value={`$${(pipelineARR / 1000).toFixed(1)}k`} />
          <button onClick={() => setExpanded(!expanded)} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left hover:border-orange-300/40">
            <div className="text-xs text-gray-400">Follow-ups due today</div>
            <div className="mt-1 text-2xl font-bold text-orange-300">{data?.summary?.dueToday ?? due.length}</div>
          </button>
          <Metric label="Last scan" value={formatDateTime(data?.generatedAt)} small />
        </div>
        {toast && <div className="mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">{toast}</div>}
        {data?.error && <div className="mt-3 flex items-center gap-2 text-xs text-red-300"><AlertCircle className="h-4 w-4" />{data.error}</div>}
      </div>

      {expanded && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Today's queue</div>
          <div className="divide-y divide-border">
            {due.length === 0 ? (
              <div className="p-5 text-sm text-gray-500">No Lucra follow-ups due today.</div>
            ) : due.map(p => (
              <div key={p.key} className="grid grid-cols-[1fr_auto] gap-4 p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{p.company}</span>
                    <span className="rounded-full bg-surface-light px-2 py-0.5 text-xs text-gray-400">{p.stage || 'Qualification'}</span>
                    <span className="text-xs text-gray-500">{p.contactName || p.contactEmail}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">{p.nextAction || 'Follow up'}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Last contact {p.lastContact || 'unknown'}</span>
                    <span>{daysSince(p.lastContact)} days waiting</span>
                    <span>{p.messageCount || 1} messages</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <ActionButton icon={<MailPlus className="h-3.5 w-3.5" />} label="Draft follow-up" busy={busyKey === `draft-follow-up:${p.key}`} onClick={() => runAction('draft-follow-up', p)} />
                  <ActionButton icon={<TimerReset className="h-3.5 w-3.5" />} label="Snooze 3d" busy={busyKey === `snooze:${p.key}`} onClick={() => runAction('snooze', p, { days: 3 })} />
                  <ActionButton icon={<XCircle className="h-3.5 w-3.5" />} label="Mark closed-lost" busy={busyKey === `mark-closed-lost:${p.key}`} onClick={() => runAction('mark-closed-lost', p)} danger />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <PipelineSheetCard />
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Recent Lucra activity</div>
          <div className="space-y-3">
            {recent.length === 0 ? <div className="text-sm text-gray-500">No recent tracker activity.</div> : recent.map(p => (
              <a key={p.key} href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(p.subject || p.contactEmail)}`} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/5 bg-white/[0.03] p-3 hover:border-cyan-400/30">
                <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-white">{p.company}</span><span className="text-xs text-gray-500">{p.lastContact}</span></div>
                <div className="mt-1 truncate text-xs text-gray-400">{p.subject || p.contactEmail}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><div className="text-xs text-gray-400">{label}</div><div className={`mt-1 font-bold text-white ${small ? 'text-sm' : 'text-2xl'}`}>{value}</div></div>;
}

function ActionButton({ icon, label, busy, onClick, danger = false }: { icon: React.ReactNode; label: string; busy?: boolean; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} disabled={busy} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${danger ? 'border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20'}`}>{busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : icon}{label}</button>;
}
