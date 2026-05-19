import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertCircle, RefreshCw, Play, FileText, BarChart3, Zap } from 'lucide-react';

interface AgentHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  status: string;
  model?: string;
  tokens?: number | null;
  percentUsed?: number | null;
  kind?: string;
}

interface Agent {
  agent_id: string;
  status: string;
  success_rate?: number | null;
  last_task?: string;
  updated_at: string;
  model?: string;
  source_agent_id?: string;
  context_used?: number;
  context_max?: number;
  subagent_count?: number;
}

interface AgentCommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onRefresh: (agentId: string) => void;
  onRestart: (agentId: string) => void;
}

interface AgentProfile {
  name: string;
  emoji: string;
  color: string;
  role: string;
  responsibilities: string[];
  capabilities: string[];
}

// Real Paperclip roster, keyed by Paperclip agent UUID.
const AGENT_CONFIG: Record<string, AgentProfile> = {
  'a0edadcb-f994-40e3-a9a1-d3ffde595c3e': {
    name: 'Clawd',
    emoji: '🦞',
    color: '#F97316',
    role: 'CEO & Orchestrator',
    responsibilities: ['Cross-agent orchestration', 'Strategic oversight', 'Decision authority', 'System health', 'Escalation handling'],
    capabilities: ['Coordinate Paperclip roster', 'Route tasks across agents', 'Spawn cron / one-shot agents', 'Monitor session telemetry', 'Resolve approvals'],
  },
  '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8': {
    name: 'Vandalay',
    emoji: '📈',
    color: '#8B5CF6',
    role: 'Chief Strategy Officer',
    responsibilities: ['Scope and review enhancements', 'System design critiques', 'Sprint shaping', 'Risk surfacing', 'Cross-team alignment'],
    capabilities: ['Review proposals', 'Draft sprint briefs', 'Audit dashboard surfaces', 'Recommend scope cuts', 'Hand off to Bob'],
  },
  '1ef5e05b-7a16-4ebc-8c05-cdb03a321197': {
    name: 'Sloan',
    emoji: '📋',
    color: '#06B6D4',
    role: 'Chief of Staff',
    responsibilities: ['Calendar & schedule ownership', 'Meeting prep', 'Action-item routing', 'Daily/weekly rhythm', 'Status synthesis'],
    capabilities: ['Manage calendar slots', 'Prep meeting briefs', 'Track follow-ups', 'Coordinate roster check-ins'],
  },
  'fd4efc78-5969-47f3-878a-457654682548': {
    name: 'Bob',
    emoji: '🔧',
    color: '#3B82F6',
    role: 'Head of Build',
    responsibilities: ['Dashboard / API implementation', 'Infrastructure changes', 'Build verification', 'Bugfix execution', 'Integration wiring'],
    capabilities: ['Edit Next.js dashboard', 'Wire Paperclip APIs', 'Run builds and tests', 'Deploy via Vercel', 'Author migrations'],
  },
  '8c40bdd4-7e82-40a7-9fa7-982b0931d705': {
    name: 'Luke',
    emoji: '💼',
    color: '#F59E0B',
    role: 'Sales & Lucra Ops',
    responsibilities: ['Lucra pipeline ownership', 'Deal follow-ups', 'Commission tracking', 'Granola routing', 'Notion deal notes'],
    capabilities: ['Update HubSpot deals', 'Pull Granola meeting context', 'Draft sales follow-ups', 'Manage Lucra commissions'],
  },
  'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6': {
    name: 'Sage',
    emoji: '🌿',
    color: '#22C55E',
    role: 'Personal & Lifestyle',
    responsibilities: ['Wellness/yoga tracking', 'Home + lifestyle context', 'Date night memory bank', 'Personal reminders'],
    capabilities: ['Update yoga schedule', 'Track wellness signals', 'Surface lifestyle goals', 'Manage memory bank'],
  },
  'e6822182-3611-4152-a1f2-aab9975fce3d': {
    name: 'Hermes',
    emoji: '✉️',
    color: '#EC4899',
    role: 'Google Workspace Ops',
    responsibilities: ['Gmail triage', 'Calendar event mgmt', 'Drive doc ops', 'Drafts and replies', 'Workspace automation'],
    capabilities: ['Categorize inbox', 'Create calendar events', 'Open Gmail threads', 'Draft replies', 'Manage Drive files'],
  },
  'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f': {
    name: 'Scout',
    emoji: '🔍',
    color: '#10B981',
    role: 'Research & Intelligence',
    responsibilities: ['Company / prospect research', 'Competitor scans', 'Battle cards', 'Market signals'],
    capabilities: ['Run web searches', 'Build battle cards', 'Summarize prospects', 'Track competitor moves'],
  },
  '951c871e-fcb0-4211-bf92-19b0812d16bd': {
    name: 'Pixel',
    emoji: '🌐',
    color: '#0EA5E9',
    role: 'Browser & Scheduling',
    responsibilities: ['Browser automation', 'Booking flows', 'Scheduling via web UIs', 'Movie / Regal sync'],
    capabilities: ['Drive Mac Chrome via CDP', 'Scrape protected sites', 'Book and reschedule', 'Sync schedule data'],
  },
  '61ee0d8e-ac57-47bc-8402-5d3a756427ad': {
    name: 'Arty',
    emoji: '🎨',
    color: '#F472B6',
    role: 'Art & Shopify Ops',
    responsibilities: ['Creative production', 'Shopify lightweight ops', 'Visual review', 'Brand consistency'],
    capabilities: ['Generate creative drafts', 'Run Shopify checks', 'Review brand surfaces'],
  },
};

export function AgentCommandCenter({ isOpen, onClose, agent, onRefresh, onRestart }: AgentCommandCenterProps) {
  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string>('');

  const safeAgent = agent || {
    agent_id: 'unknown',
    status: 'offline',
    updated_at: new Date(0).toISOString(),
    success_rate: null,
    last_task: '',
    model: undefined,
    source_agent_id: undefined,
    context_used: 0,
    context_max: 0,
    subagent_count: 0,
  };

  const config: AgentProfile = AGENT_CONFIG[safeAgent.agent_id] || {
    name: safeAgent.agent_id,
    emoji: '🤖',
    color: '#6B7280',
    role: 'Paperclip agent',
    responsibilities: ['Profile not yet defined for this agent.'],
    capabilities: ['Live telemetry only — capabilities pending.'],
  };

  const hasSuccessRate = typeof agent?.success_rate === 'number' && Number.isFinite(agent.success_rate);
  const successRate = hasSuccessRate ? Math.max(0, Math.min(100, Number(agent!.success_rate))) : null;
  const successRateColor = successRate == null
    ? 'text-gray-400'
    : successRate >= 90
      ? 'text-green-400'
      : successRate >= 70
        ? 'text-yellow-400'
        : 'text-red-400';

  const isOnline = safeAgent.status === 'online' || safeAgent.status === 'idle' || safeAgent.status === 'running';
  const lastUpdate = new Date(safeAgent.updated_at);
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / 1000 / 60);

  useEffect(() => {
    if (!isOpen || !agent) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    let active = true;
    const agentId = agent.agent_id;
    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        const data = await res.json();
        if (active) setHistory(data.history || []);
      } catch {
        if (active) setHistory([]);
      } finally {
        if (active) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, [isOpen, agent]);

  async function runAction(action: 'refresh' | 'restart' | 'inspect') {
    if (!agent) return;
    setActionLoading(action);
    setActionResult('');
    try {
      const res = await fetch('/api/agents/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.agent_id, action }),
      });
      const data = await res.json();
      if (action === 'refresh') {
        await onRefresh(agent.agent_id);
        const historyRes = await fetch(`/api/agents/${agent.agent_id}`);
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
      if (action === 'inspect' && Array.isArray(data.sessions)) {
        setActionResult(`${data.sessions.length} session(s) inspected for ${data.normalizedAgentId}.`);
      } else {
        setActionResult(data.message || `${action} completed.`);
      }
    } catch {
      setActionResult(`${action} failed.`);
    } finally {
      setActionLoading(null);
    }
  }

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${config.color}20` }}>
              {config.emoji}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: config.color }}>{config.name}</h2>
              <p className="text-xs text-gray-400">{config.role}</p>
              <p className="text-[10px] text-gray-600 font-mono">{agent.agent_id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isOnline ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-lg">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Health Metrics */}
              <div className="bg-surface-light rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Health Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Success Rate</span>
                    <span className={`font-mono font-bold ${successRateColor}`}>
                      {successRate == null ? 'live / unavailable' : `${successRate}%`}
                    </span>
                  </div>
                  {successRate != null ? (
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${successRate}%`, backgroundColor: config.color }} />
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">No success-rate telemetry yet. Will populate once agent run history is wired to Supabase.</div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-gray-300">{timeSinceUpdate} min ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Task</span>
                    <span className="text-gray-300 truncate max-w-[150px]">{agent.last_task || 'Idle'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Model</span>
                    <span className="text-gray-300 truncate max-w-[150px]">{agent.model || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Context</span>
                    <span className="text-gray-300">{agent.context_used || 0} / {agent.context_max || 0}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-surface-light rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => runAction('refresh')} disabled={actionLoading !== null} className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-border rounded-lg text-sm disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                  <button onClick={async () => { await runAction('restart'); await onRestart(agent.agent_id); }} disabled={actionLoading !== null} className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-border rounded-lg text-sm disabled:opacity-50">
                    <Play className="w-4 h-4" /> Restart
                  </button>
                  <button onClick={() => runAction('inspect')} disabled={actionLoading !== null} className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-border rounded-lg text-sm disabled:opacity-50">
                    <FileText className="w-4 h-4" /> Inspect
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-border rounded-lg text-sm opacity-60 cursor-default">
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </button>
                </div>
                {actionResult ? (
                  <div className="mt-3 text-xs text-cyan-300">{actionResult}</div>
                ) : null}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Responsibilities */}
              <div className="bg-surface-light rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Responsibilities</h3>
                <ul className="space-y-2">
                  {config.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Capabilities */}
              <div className="bg-surface-light rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Capabilities</h3>
                <ul className="space-y-2">
                  {config.capabilities.map((cap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 mt-0.5 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface-light rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Sessions / History</h3>
                {historyLoading ? (
                  <div className="text-sm text-gray-500">Loading history…</div>
                ) : history.length === 0 ? (
                  <div className="text-sm text-gray-500">No recent session history.</div>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {history.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white truncate">{item.title}</span>
                          <span className="text-gray-500 uppercase">{item.status}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-gray-400">
                          <span>{item.model || 'unknown model'}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        <div className="mt-1 text-gray-500">
                          {item.tokens != null ? `${item.tokens} tokens` : 'tokens unavailable'}
                          {item.percentUsed != null ? ` • ${item.percentUsed}% used` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
