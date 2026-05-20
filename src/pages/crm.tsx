import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  ExternalLink,
  Loader2,
  Mail,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { AGENT_ROSTER } from '../lib/agents';

interface DealCard {
  id: string;
  name: string;
  amount: number | null;
  amountFormatted: string;
  pipelineId: string;
  stageId: string;
  stageLabel: string;
  closeDate: string | null;
  daysInStage: number | null;
  url: string;
}

interface PipelineColumn {
  id: string;
  label: string;
  isClosed: boolean;
  probability: number | null;
  deals: DealCard[];
  totalValue: number;
}

interface PipelineGroup {
  id: string;
  label: string;
  stages: PipelineColumn[];
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
}

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  location: string | null;
}

interface GmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  url: string;
}

interface LinkedTask {
  id: string;
  identifier: string | null;
  title: string;
  rawStatus: string;
  assignee: string | null;
  url: string;
  updatedAt: string | null;
}

interface DealDetail {
  deal: {
    id: string;
    name: string;
    amount: number | null;
    stage: string;
    pipeline: string;
    closeDate: string | null;
    description: string | null;
    lastModified: string | null;
    url: string;
  };
  contacts: Contact[];
  companies: Company[];
  gmail: GmailThread[];
  paperclipTasks: LinkedTask[];
  notion: { connected: boolean; note: string | null; pages: NotionPageHit[] };
  granola: { connected: boolean; note: string | null; meetings: GranolaMeeting[] };
}

interface NotionPageHit {
  id: string;
  title: string;
  url: string;
  lastEdited: string | null;
  preview: string;
}

interface GranolaMeeting {
  id: string;
  title: string;
  date: string | null;
  participants: string[];
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function relativeDays(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return null;
  const d = Math.round(ms / 86_400_000);
  if (d < 1) return 'today';
  if (d < 7) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<PipelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dragDealId, setDragDealId] = useState<string | null>(null);
  const [stageBusyKey, setStageBusyKey] = useState<string | null>(null);

  const loadDeals = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/crm/deals');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Deals API returned ${res.status}`);
      setPipelines(Array.isArray(data.pipelines) ? data.pipelines : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load deals');
      setPipelines([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeals('initial');
  }, [loadDeals]);

  const advanceDealToStage = useCallback(
    async (dealId: string, stageId: string) => {
      const busyKey = `${dealId}::${stageId}`;
      setStageBusyKey(busyKey);
      try {
        const res = await fetch(`/api/crm/deal/${encodeURIComponent(dealId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Stage update failed (${res.status})`);

        // Optimistic local move so the card jumps to the new column without a refetch.
        setPipelines((prev) => prev.map((group) => {
          if (!group.stages.some((s) => s.id === stageId || s.deals.some((d) => d.id === dealId))) return group;
          let movingCard: DealCard | null = null;
          const stagesAfterRemove = group.stages.map((s) => {
            const idx = s.deals.findIndex((d) => d.id === dealId);
            if (idx >= 0) {
              movingCard = s.deals[idx];
              const dealsCopy = s.deals.filter((_, i) => i !== idx);
              return { ...s, deals: dealsCopy, totalValue: dealsCopy.reduce((sum, d) => sum + (d.amount || 0), 0) };
            }
            return s;
          });
          if (!movingCard) return { ...group, stages: stagesAfterRemove };
          return {
            ...group,
            stages: stagesAfterRemove.map((s) => {
              if (s.id !== stageId) return s;
              const updatedCard: DealCard = { ...movingCard!, stageId, stageLabel: s.label, daysInStage: 0 };
              const dealsCopy = [updatedCard, ...s.deals];
              return { ...s, deals: dealsCopy, totalValue: dealsCopy.reduce((sum, d) => sum + (d.amount || 0), 0) };
            }),
          };
        }));
      } catch (err: any) {
        setError(err?.message || 'Stage update failed');
      } finally {
        setStageBusyKey(null);
      }
    },
    []
  );

  const totalActiveDeals = useMemo(() => {
    return pipelines.reduce((sum, g) => sum + g.stages.reduce((s, st) => s + st.deals.length, 0), 0);
  }, [pipelines]);

  const totalActiveValue = useMemo(() => {
    return pipelines.reduce((sum, g) => sum + g.stages.reduce((s, st) => s + st.totalValue, 0), 0);
  }, [pipelines]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col">
      <Head>
        <title>CRM — Mat Mission Control</title>
      </Head>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/mat" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Briefcase className="w-6 h-6 text-orange-400" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">CRM</h1>
              <p className="text-xs text-gray-400">
                Live HubSpot kanban — {totalActiveDeals} active deals · ${(totalActiveValue / 1000).toFixed(0)}k pipeline
              </p>
            </div>
          </div>
          <button
            onClick={() => loadDeals('refresh')}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh] text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading deals from HubSpot…
          </div>
        ) : error ? (
          <div className="m-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>
                <div className="font-medium">HubSpot needs attention</div>
                <div className="text-sm mt-1 text-yellow-200/80">{error}</div>
              </div>
            </div>
          </div>
        ) : pipelines.length === 0 ? (
          <div className="m-4 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-gray-400 text-sm">
            HubSpot returned no active deals.
          </div>
        ) : (
          <div className="overflow-x-auto px-4 py-4 space-y-6">
            {pipelines.map((group) => (
              <PipelineBoard
                key={group.id}
                group={group}
                dragDealId={dragDealId}
                setDragDealId={setDragDealId}
                onDropToStage={(dealId, stageId) => advanceDealToStage(dealId, stageId)}
                onSelect={setSelectedDealId}
                stageBusyKey={stageBusyKey}
              />
            ))}
          </div>
        )}
      </main>

      {selectedDealId && (
        <DealDrawer
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
          onTaskCreated={() => loadDeals('refresh')}
        />
      )}
    </div>
  );
}

function PipelineBoard({
  group,
  dragDealId,
  setDragDealId,
  onDropToStage,
  onSelect,
  stageBusyKey,
}: {
  group: PipelineGroup;
  dragDealId: string | null;
  setDragDealId: (id: string | null) => void;
  onDropToStage: (dealId: string, stageId: string) => void;
  onSelect: (id: string) => void;
  stageBusyKey: string | null;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{group.label}</h2>
        <span className="text-[10px] text-gray-500">
          {group.stages.reduce((s, st) => s + st.deals.length, 0)} deals
        </span>
      </div>
      <div className="flex gap-3 min-w-fit">
        {group.stages.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            isDropTarget={!!dragDealId}
            isBusy={!!stageBusyKey?.endsWith(`::${column.id}`)}
            onDrop={(dealId) => onDropToStage(dealId, column.id)}
            onDragStart={(dealId) => setDragDealId(dealId)}
            onDragEnd={() => setDragDealId(null)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function KanbanColumn({
  column,
  isDropTarget,
  isBusy,
  onDrop,
  onDragStart,
  onDragEnd,
  onSelect,
}: {
  column: PipelineColumn;
  isDropTarget: boolean;
  isBusy: boolean;
  onDrop: (dealId: string) => void;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onDragOver={(e) => { if (isDropTarget) { e.preventDefault(); setHover(true); } }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const dealId = e.dataTransfer.getData('text/deal-id');
        if (dealId) onDrop(dealId);
      }}
      className={`min-w-[280px] w-[280px] rounded-xl border bg-[#141414] p-3 transition-colors ${
        hover ? 'border-orange-500/60' : 'border-white/10'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">{column.label}</div>
          <div className="text-[10px] text-gray-500">
            {column.deals.length} deals
            {column.totalValue > 0 ? ` · $${(column.totalValue / 1000).toFixed(0)}k` : ''}
            {column.probability != null ? ` · ${Math.round(column.probability * 100)}%` : ''}
          </div>
        </div>
        {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />}
      </div>

      <div className="space-y-2">
        {column.deals.length === 0 ? (
          <div className="rounded border border-dashed border-white/10 px-2 py-3 text-center text-[11px] text-gray-600">
            Empty stage
          </div>
        ) : (
          column.deals.map((deal) => (
            <DealKanbanCard
              key={deal.id}
              deal={deal}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DealKanbanCard({
  deal,
  onDragStart,
  onDragEnd,
  onSelect,
}: {
  deal: DealCard;
  onDragStart: (dealId: string) => void;
  onDragEnd: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/deal-id', deal.id); onDragStart(deal.id); }}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(deal.id)}
      className="w-full text-left rounded-lg border border-white/10 bg-[#1a1a1a] p-2.5 hover:border-orange-500/40 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-white truncate">{deal.name}</div>
        <div className="text-xs font-mono text-orange-300 flex-shrink-0">{deal.amountFormatted}</div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
        <span>{deal.closeDate ? `Close ${formatDate(deal.closeDate)}` : 'No close date'}</span>
        <span>{deal.daysInStage != null ? `${deal.daysInStage}d` : ''}</span>
      </div>
    </button>
  );
}

function DealDrawer({
  dealId,
  onClose,
  onTaskCreated,
}: {
  dealId: string;
  onClose: () => void;
  onTaskCreated: () => void;
}) {
  const [data, setData] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New follow-up task state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/crm/deal/${encodeURIComponent(dealId)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || `Drawer load failed (${r.status})`);
        if (!cancelled) setData(body);
      })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load deal context'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dealId]);

  const createFollowUp = async () => {
    const title = newTaskTitle.trim();
    if (!title || !data) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const fullTitle = `[${data.deal.name}] ${title}`;
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: fullTitle,
          description: data.deal.url ? `HubSpot deal: ${data.deal.url}` : undefined,
          priority: 'medium',
          assigneeAgentId: newTaskAssignee || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Create failed (${res.status})`);
      setCreateSuccess(`Created ${body.task?.identifier || 'task'}`);
      setNewTaskTitle('');
      onTaskCreated();
    } catch (err: any) {
      setCreateError(err?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0f0f0f] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Deal Detail</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {loading ? (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : error ? (
            <div className="text-sm text-yellow-300">{error}</div>
          ) : data ? (
            <>
              {/* Deal facts */}
              <section>
                <h3 className="text-base font-semibold text-white">{data.deal.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="font-mono text-orange-300">
                    {data.deal.amount != null ? `$${data.deal.amount.toLocaleString()}` : '—'}
                  </span>
                  {data.deal.closeDate && <span>Close: {formatDate(data.deal.closeDate)}</span>}
                  {data.deal.lastModified && <span>Updated {relativeDays(data.deal.lastModified)}</span>}
                </div>
                {data.deal.description && (
                  <p className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">{data.deal.description}</p>
                )}
                <a
                  href={data.deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200"
                >
                  Open in HubSpot <ExternalLink className="w-3 h-3" />
                </a>
              </section>

              {/* Contacts + companies */}
              {(data.contacts.length > 0 || data.companies.length > 0) && (
                <DrawerSection title="Contacts & Companies" icon={<User className="w-4 h-4" />}>
                  {data.companies.map((c) => (
                    <div key={c.id} className="text-xs">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <Building2 className="w-3 h-3 text-gray-500" />
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <div className="text-gray-500 ml-4">
                        {[c.industry, c.location, c.domain].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  ))}
                  {data.contacts.map((c) => (
                    <div key={c.id} className="text-xs">
                      <div className="text-gray-200">{c.name}</div>
                      <div className="text-gray-500">
                        {[c.jobTitle, c.email, c.phone].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  ))}
                </DrawerSection>
              )}

              {/* Gmail threads */}
              <DrawerSection title={`Recent Gmail (${data.gmail.length})`} icon={<Mail className="w-4 h-4" />}>
                {data.gmail.length === 0 ? (
                  <div className="text-xs text-gray-500">
                    {data.contacts.length === 0
                      ? 'No contacts → no Gmail lookup.'
                      : 'No matching threads in the last sync window.'}
                  </div>
                ) : (
                  data.gmail.map((t) => (
                    <a
                      key={t.id}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 hover:border-orange-500/30"
                    >
                      <div className="text-xs text-white truncate">{t.subject}</div>
                      <div className="text-[10px] text-gray-500 truncate">{t.from}</div>
                      <div className="text-[10px] text-gray-600 line-clamp-2">{t.snippet}</div>
                    </a>
                  ))
                )}
              </DrawerSection>

              {/* Linked Paperclip tasks */}
              <DrawerSection title={`Linked tasks (${data.paperclipTasks.length})`} icon={<Briefcase className="w-4 h-4" />}>
                {data.paperclipTasks.length === 0 ? (
                  <div className="text-xs text-gray-500">No Paperclip tasks mention this deal or its contacts.</div>
                ) : (
                  data.paperclipTasks.map((t) => (
                    <a
                      key={t.id}
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 hover:border-orange-500/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs text-white truncate">{t.title}</div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{t.identifier}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {t.assignee || 'Unassigned'} · {t.rawStatus} {t.updatedAt ? `· ${relativeDays(t.updatedAt)}` : ''}
                      </div>
                    </a>
                  ))
                )}

                <div className="mt-3 rounded border border-white/10 bg-white/[0.02] p-2 space-y-1.5">
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="New follow-up task title…"
                    disabled={creating}
                    className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[12px] text-gray-100 placeholder:text-gray-600 focus:border-orange-500/40 outline-none"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      disabled={creating}
                      className="rounded border border-white/10 bg-black/30 px-1.5 py-1 text-[11px] text-gray-200"
                    >
                      <option value="">Unassigned</option>
                      {AGENT_ROSTER.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.emoji} {agent.name}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={creating || !newTaskTitle.trim()}
                      onClick={createFollowUp}
                      className="ml-auto text-[11px] rounded border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-300 hover:bg-green-500/20 disabled:opacity-40"
                    >
                      {creating ? 'Creating…' : 'Create in Paperclip'}
                    </button>
                  </div>
                  {createError && <div className="text-[11px] text-red-300">{createError}</div>}
                  {createSuccess && <div className="text-[11px] text-green-300">{createSuccess}</div>}
                </div>
              </DrawerSection>

              {/* Notion notes */}
              <DrawerSection title={`Notion notes${data.notion.pages?.length ? ` (${data.notion.pages.length})` : ''}`}>
                {data.notion.pages && data.notion.pages.length > 0 ? (
                  data.notion.pages.map((p) => (
                    <a
                      key={p.id}
                      href={p.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 hover:border-orange-500/30"
                    >
                      <div className="text-xs text-white truncate">{p.title}</div>
                      {p.lastEdited && (
                        <div className="text-[10px] text-gray-500">edited {relativeDays(p.lastEdited)}</div>
                      )}
                    </a>
                  ))
                ) : (
                  <div className="text-[11px] text-gray-500">{data.notion.note}</div>
                )}
              </DrawerSection>

              {/* Granola meetings */}
              <DrawerSection title={`Granola meetings${data.granola.meetings?.length ? ` (${data.granola.meetings.length})` : ''}`}>
                {data.granola.meetings && data.granola.meetings.length > 0 ? (
                  data.granola.meetings.map((m) => (
                    <div key={m.id} className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5">
                      <div className="text-xs text-white truncate">{m.title}</div>
                      <div className="text-[10px] text-gray-500">
                        {m.date || ''}{m.participants.length ? ` · ${m.participants.length} participants` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-gray-500">{data.granola.note}</div>
                )}
              </DrawerSection>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DrawerSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500">
        {icon}
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}
