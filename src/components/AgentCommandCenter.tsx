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
  success_rate?: number;
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

const AGENT_CONFIG: Record<string, { name: string; emoji: string; color: string; responsibilities: string[]; capabilities: string[] }> = {
  'work-agent': {
    name: 'Work Agent',
    emoji: '💼',
    color: '#F97316',
    responsibilities: ['Sales pipeline monitoring', 'Deal health tracking', 'Morning briefings', 'HubSpot sync', 'Stale deal alerts'],
    capabilities: ['Query HubSpot CRM', 'Generate pipeline reports', 'Create deal summaries', 'Send Slack notifications', 'Schedule follow-ups']
  },
  'email-agent': {
    name: 'Email Agent',
    emoji: '📧',
    color: '#EC4899',
    responsibilities: ['Gmail inbox monitoring', 'Email categorization', 'Tone learning', 'Smart triage', 'Draft suggestions'],
    capabilities: ['Read Gmail inbox', 'Categorize emails', 'Learn writing style', 'Suggest responses', 'Create tasks from emails']
  },
  'hubspot-agent': {
    name: 'HubSpot Agent',
    emoji: '🎯',
    color: '#06B6D4',
    responsibilities: ['CRM data sync', 'Pipeline forecasting', 'Deal stage tracking', 'Contact management', 'Sales analytics'],
    capabilities: ['Sync deals and contacts', 'Generate forecasts', 'Track deal velocity', 'Calculate win probabilities', 'Export pipeline data']
  },
  'build-agent': {
    name: 'Build Agent',
    emoji: '🔧',
    color: '#3B82F6',
    responsibilities: ['API integrations', 'Dashboard development', 'Infrastructure', 'Code deployment', 'Feature implementation'],
    capabilities: ['Deploy to Vercel', 'Manage Supabase', 'Build UI components', 'Create API endpoints', 'Handle GitHub workflows']
  },
  'research-agent': {
    name: 'Research Agent',
    emoji: '🔍',
    color: '#10B981',
    responsibilities: ['Company intelligence', 'Competitor research', 'Battle card creation', 'Market analysis', 'Prospect research'],
    capabilities: ['Search company data', 'Analyze competitors', 'Generate battle cards', 'Research prospects', 'Find industry trends']
  },
  'lifestyle-agent': {
    name: 'Lifestyle Agent',
    emoji: '🌟',
    color: '#8B5CF6',
    responsibilities: ['Wellness tracking', 'Schedule optimization', 'Personal reminders', 'Work-life balance', 'Health monitoring'],
    capabilities: ['Track wellness metrics', 'Optimize calendar', 'Send break reminders', 'Monitor work hours', 'Suggest wellness activities']
  },
  'clawd-prime': {
    name: 'CLAWD Prime',
    emoji: '🦞',
    color: '#F97316',
    responsibilities: ['Director and orchestrator', 'Agent coordination', 'Strategic oversight', 'Decision authority', 'Cross-agent workflows'],
    capabilities: ['Coordinate all agents', 'Make strategic decisions', 'Orchestrate workflows', 'Monitor system health', 'Handle escalations']
  }
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
    success_rate: 0,
    last_task: '',
    model: undefined,
    source_agent_id: undefined,
    context_used: 0,
    context_max: 0,
    subagent_count: 0,
  };

  const config = AGENT_CONFIG[safeAgent.agent_id] || {
    name: safeAgent.agent_id,
    emoji: '🤖',
    color: '#6B7280',
    responsibilities: ['General agent tasks'],
    capabilities: ['Standard operations']
  };

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
              <p className="text-sm text-gray-500">{agent.agent_id}</p>
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
                    <span className={`font-mono font-bold ${(agent.success_rate || 0) >= 90 ? 'text-green-400' : (agent.success_rate || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {agent.success_rate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${agent.success_rate || 0}%`, backgroundColor: config.color }} />
                  </div>
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
