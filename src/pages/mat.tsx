import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Activity, Mail, Cpu, Zap, TrendingUp, AlertCircle,
  CheckCircle, Clock, RefreshCw, Command, Reply, X,
} from 'lucide-react';
import { useCommandPalette, useRealtimeData, useAgentActions } from '../hooks/useMissionControl';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { useQuickStats } from '../hooks/useQuickStats';
import { AgentCard } from '../components/AgentCard';
import { SessionTree } from '../components/SessionTree';
import { CommandPalette } from '../components/CommandPalette';
import { LifestyleHealthPanel } from '../components/LifestyleHealthPanel';
import { QuickActionsPalette } from '../components/QuickActionsPalette';
import { AgentCommandCenter } from '../components/AgentCommandCenter';
import { SalesIntelligenceHub } from '../components/SalesIntelligenceHub';
import { DocumentRepository } from '../components/DocumentRepository';
import { PipelineDetailModal } from '../components/PipelineDetailModal';
import { EmailDetailModal } from '../components/EmailDetailModal';
import { CalendarPanel } from '../components/CalendarPanel';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { HomeAssistantCard } from '../components/HomeAssistantCard';
import { PipelineSheetCard } from '../components/PipelineSheetCard';
import { EmailCard } from '../components/EmailCard';
import { MergedCalendarCard } from '../components/MergedCalendarCard';
import { IntegrationStatusPanel } from '../components/IntegrationStatusPanel';
import { LucraCommissionCard } from '../components/LucraCommissionCard';
import { LucraDashboard } from '../components/lucra/LucraDashboard';
import { LifestyleGoalTrackerCard } from '../components/LifestyleGoalTrackerCard';
import { UnifiedMovieCard } from '../components/UnifiedMovieCard';
import { DateNightMemoryBankCard } from '../components/DateNightMemoryBankCard';
import { RecommendationsCard } from '../components/RecommendationsCard';
import { QuickStatsBar } from '../components/QuickStatsBar';
import { TodayNeedsAttention } from '../components/TodayNeedsAttention';
import { NotificationCenter } from '../components/NotificationCenter';
import { FirstTimeCollectorLadderCard } from '../components/FirstTimeCollectorLadderCard';
import { CollectorReengagementRadarCard } from '../components/CollectorReengagementRadarCard';
import { DASHBOARD_CONFIG, DashboardMode, getDashboardMode } from '../lib/dashboard-config';
import { AnimatedCard, StaggerContainer, StaggerItem, FadeIn, SlideIn } from '../components/animations';
import { AGENT_ROSTER } from '../lib/agents';

// Fallback agent list shown when /api/agents/status hasn't responded yet.
// Status defaults to 'idle' — real status comes from useAgentStatus when live.
const AGENTS = AGENT_ROSTER.map((profile) => ({
  id: profile.id,
  name: profile.name,
  emoji: profile.emoji,
  color: profile.color,
  role: profile.role,
  level: profile.level,
  status: 'idle' as const,
  lastActive: new Date().toISOString(),
}));

export default function MatMissionControl() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const { spawnAgent, refreshAgent, restartAgent } = useAgentActions();
  const { 
    emails, pipeline, calendarEvents,
    loading, lastRefresh, refresh 
  } = useRealtimeData();
  const { data: agentStatus, refresh: refreshAgents } = useAgentStatus();
  const { data: quickStats } = useQuickStats();

  const openAgentCommandCenter = (agent: any) => {
    // success_rate comes from /api/agents/status, derived from recent session
    // abort flags. When telemetry has no signal we pass null and the modal
    // renders "live / unavailable" rather than a fabricated number.
    const liveRate = typeof agent.successRate === 'number' ? agent.successRate : null;
    setSelectedAgent({
      agent_id: agent.id,
      status: agent.status,
      updated_at: agent.lastActive,
      success_rate: liveRate,
      last_task: agent.lastTask || agent.role,
      model: agent.model,
      source_agent_id: agent.sourceAgentId,
      context_used: agent.contextUsed,
      context_max: agent.contextMax,
      subagent_count: agent.subagentCount,
    });
    setShowAgentCommandCenter(true);
  };
  const [activeAction, setActiveAction] = useState('');
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAgentCommandCenter, setShowAgentCommandCenter] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showSalesHub, setShowSalesHub] = useState(false);
  const [mobileTab, setMobileTab] = useState<'agents' | 'life' | 'work'>('life');
  const [systemTab, setSystemTab] = useState<'memory' | 'health' | 'cron'>('memory');
  const [desktopSection, setDesktopSection] = useState<'work' | 'lucra' | 'agents' | 'life' | 'system'>('work');
  const [priorityMode, setPriorityMode] = useState(false);
  const [showUrgentEmails, setShowUrgentEmails] = useState(false);
  const [showReplyNeededEmails, setShowReplyNeededEmails] = useState(false);

  const dashboardMode: DashboardMode = 'mat';
  const dashboard = DASHBOARD_CONFIG[dashboardMode];
  const isSarahMode = false;
  const setMode = () => {};
  const showCard = (id: string) =>
    dashboard.leftCards.includes(id as any) ||
    dashboard.centerCards.includes(id as any) ||
    dashboard.rightCards.includes(id as any);

  // Quick Actions keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickActions(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const currentDate = new Date().toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleCommand = async (command: string) => {
    setActiveAction(command);
    
    switch (command) {
      case 'check-inbox':
        await refreshAgent('email-agent');
        break;
      case 'refresh-pipeline':
        await refreshAgent('hubspot-agent');
        break;
      case 'spawn-research':
        await spawnAgent('research-agent', 'Company research');
        break;
      case 'spawn-build':
        await spawnAgent('build-agent', 'Feature development');
        break;
      case 'refresh-all':
        await refresh();
        break;
    }
    
    setTimeout(() => setActiveAction(''), 1000);
  };

  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [amexBenefits, setAmexBenefits] = useState<any[]>([
    {
      id: 'resy-quarterly',
      name: '$400 Resy Credit',
      card: 'Amex Platinum',
      category: 'Dining',
      frequency: 'quarterly',
      periodCap: 100,
      annualCap: 400,
      usedAmount: 0,
      status: 'unused',
      enrollmentRequired: true,
      notes: 'Up to $100 per quarter. User noted unused.',
    },
    {
      id: 'lululemon',
      name: 'Lululemon Benefit',
      card: 'Amex Platinum',
      category: 'Shopping',
      frequency: 'annual',
      annualCap: 0,
      usedAmount: 0,
      status: 'unused',
      enrollmentRequired: false,
      notes: 'User noted unused. Confirm annual cap from benefits terms.',
    },
  ]);

  // Fetch live tasks from Paperclip, refresh every 2 minutes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('tasks fetch failed');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      } catch (e) {
        console.error('Failed to load Paperclip tasks:', e);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 120000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('mission-control-amex-benefits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setAmexBenefits(parsed);
      }
    } catch (e) {
      console.error('Failed to load amex benefits:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mission-control-amex-benefits', JSON.stringify(amexBenefits));
    } catch (e) {
      console.error('Failed to save amex benefits:', e);
    }
  }, [amexBenefits]);

  const addTask = (task: any) => {
    setTasks([...tasks, { ...task, id: Date.now().toString() }]);
  };

  const updateTask = (id: string, updates: any) => {
    setTasks((prev) => {
      const current = prev.find((t: any) => t.id === id);
      const next = prev.map((t: any) => (t.id === id ? { ...t, ...updates } : t));

      // Auto-rollover recurring tasks when marked completed.
      if (current && updates?.status === 'completed' && current.recurrence && current.recurrence !== 'none') {
        const base = current.dueDate ? new Date(current.dueDate) : new Date();
        const nextDue = new Date(base);
        if (current.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        if (current.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        if (current.recurrence === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

        next.push({
          ...current,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          status: 'pending',
          dueDate: nextDue.toISOString().slice(0, 10),
          snoozedUntil: undefined,
        });
      }

      return next;
    });
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Merge a Paperclip task PATCH response into local state.
  // Used by NeedsMatQueue inline actions so the queue updates without
  // waiting on the next 2-minute /api/tasks poll. Map server rawStatus
  // back to the dashboard's flattened status field so attention heuristics stay correct.
  const applyTaskPatch = (updated: any) => {
    if (!updated || !updated.id) return;
    setTasks((prev) =>
      prev.map((t: any) => {
        if (t.id !== updated.id) return t;
        const merged = { ...t, ...updated };
        const rs = String(updated.rawStatus || '').toLowerCase();
        if (rs === 'blocked') merged.status = 'blocked';
        else if (rs === 'in_progress' || rs === 'in_review') merged.status = 'in_progress';
        else if (rs === 'done' || rs === 'completed' || rs === 'closed') merged.status = 'completed';
        else if (rs) merged.status = 'pending';
        return merged;
      })
    );
  };

  return (
    <div className="mission-shell min-h-screen text-white flex flex-col">
      <Head>
        <title>Mat Mission Control</title>
      </Head>

      <CommandPalette 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onSelect={handleCommand}
      />

      <QuickActionsPalette
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        agents={agentStatus?.agents || []}
        pipeline={pipeline}
        emails={emails}
        onRefresh={refresh}
      />

      <PipelineDetailModal
        isOpen={showPipelineModal}
        onClose={() => setShowPipelineModal(false)}
        pipeline={pipeline}
      />

      <EmailDetailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        emails={emails}
      />

      <TaskDetailModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        tasks={tasks}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
      />

      <AgentCommandCenter
        isOpen={showAgentCommandCenter}
        onClose={() => setShowAgentCommandCenter(false)}
        agent={selectedAgent}
        onRefresh={refreshAgent}
        onRestart={restartAgent}
      />

      <SalesIntelligenceHub
        isOpen={showSalesHub}
        onClose={() => setShowSalesHub(false)}
        pipeline={pipeline}
        onRefresh={refresh}
      />

      {/* Urgent Emails Modal */}
      {showUrgentEmails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowUrgentEmails(false)} />
          <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold">Urgent Emails</h2>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  {emails.filter((e: any) => e.category === 'URGENT').length}
                </span>
              </div>
              <button onClick={() => setShowUrgentEmails(false)} className="p-2 hover:bg-surface-light rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {emails.filter((e: any) => e.category === 'URGENT').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No urgent emails</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emails.filter((e: any) => e.category === 'URGENT').map((email: any) => (
                    <div key={email.id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{email.from_name || email.from_email}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(email.received_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{email.subject}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{email.snippet}</p>
                      <div className="flex gap-2">
                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-surface-light hover:bg-border px-3 py-1.5 rounded transition-colors"
                        >
                          View in Gmail
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply Needed Emails Modal */}
      {showReplyNeededEmails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReplyNeededEmails(false)} />
          <div className="relative bg-surface border border-border rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Reply Needed</h2>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  {emails.filter((e: any) => e.category === 'REPLY_NEEDED').length}
                </span>
              </div>
              <button onClick={() => setShowReplyNeededEmails(false)} className="p-2 hover:bg-surface-light rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {emails.filter((e: any) => e.category === 'REPLY_NEEDED').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Reply className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No emails waiting for reply</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emails.filter((e: any) => e.category === 'REPLY_NEEDED').map((email: any) => (
                    <div key={email.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{email.from_name || email.from_email}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(email.received_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{email.subject}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{email.snippet}</p>
                      <div className="flex gap-2">
                        <a
                          href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-3 py-1.5 rounded transition-colors"
                        >
                          Reply in Gmail
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/72 backdrop-blur-2xl shadow-2xl shadow-black/20">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-orange-400/30 bg-orange-500/15 text-2xl shadow-lg shadow-orange-500/10">🦞</span>
            <div>
              <h1 className="font-bold text-base lg:text-lg tracking-tight">{dashboard.title}</h1>
              <p className="text-xs text-gray-400 hidden sm:block">{dashboard.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <span>{currentDate}</span>
              <span>•</span>
              <span className="font-mono">{currentTime} PT</span>
              {lastRefresh && (
                <span className="text-xs text-gray-600 ml-2">
                  (updated {Math.floor((Date.now() - lastRefresh.getTime()) / 1000)}s ago)
                </span>
              )}
            </div>

            <button 
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm shadow-sm"
            >
              <Command className="w-4 h-4" />
              <span className="hidden sm:inline">Command</span>
              <span className="text-xs text-gray-500 hidden sm:inline">⌘K</span>
            </button>
            
            <button 
              onClick={refresh}
              disabled={loading}
              className={`p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {!isSarahMode && <NotificationCenter />}

            {/* Priority Mode Toggle */}
            <button
              onClick={() => setPriorityMode(!priorityMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                priorityMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-surface-light hover:bg-border text-gray-400'
              }`}
              title={priorityMode ? 'Exit Priority Mode' : 'Enter Priority Mode'}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{priorityMode ? 'Priority' : 'Normal'}</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Date Bar */}
        <div className="md:hidden border-t border-border/50 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{currentDate}</span>
            <span className="font-mono">{currentTime} PT</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col items-center w-[72px] border-r border-white/10 bg-slate-950/55 py-4 gap-2 flex-shrink-0 overflow-y-auto backdrop-blur-xl">
          {([
            { id: 'work', emoji: '💼', label: 'Work' },
            { id: 'lucra', emoji: '🏟️', label: 'Lucra' },
            { id: 'agents', emoji: '🤖', label: 'Agents' },
            { id: 'life', emoji: '🌿', label: 'Life' },
            { id: 'system', emoji: '⚙️', label: 'System' },
          ] as const).map(({ id, emoji, label }) => (
            <button
              key={id}
              onClick={() => setDesktopSection(id)}
              title={label}
              className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                desktopSection === id
                  ? 'bg-gradient-to-br from-orange-500/25 to-cyan-500/10 text-white border border-orange-400/30 shadow-lg shadow-orange-500/10'
                  : 'text-gray-500 hover:bg-white/10 hover:text-gray-200 border border-transparent'
              }`}
            >
              {desktopSection === id && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-work rounded-r" />
              )}
              <span className="text-xl">{emoji}</span>
              <span className="text-[9px] mt-0.5 font-medium">{label}</span>
            </button>
          ))}
        </aside>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-4">

          {activeAction && (
            <div className="mx-4 mt-4 px-4 py-2 bg-work/20 border border-work/30 rounded-lg text-sm text-work">
              Executing: {activeAction.replace('-', ' ')}
            </div>
          )}

          {/* QuickStatsBar — always visible */}
          {!isSarahMode && (
            <div className="px-4 pt-3 pb-2 border-b border-white/10">
              <QuickStatsBar
                urgentEmails={emails.filter((e: any) => e.category === 'URGENT').length}
                replyNeededEmails={emails.filter((e: any) => e.category === 'REPLY_NEEDED').length}
                pipelineMRR={quickStats.pipelineMRR}
                pipelineARR={quickStats.pipelineARR}
                yogaClasses={quickStats.yogaClasses}
                watchlistCount={quickStats.watchlistCount}
                buddyPasses={quickStats.buddyPasses}
                buddyPassDays={quickStats.buddyPassDays}
                onUrgentClick={() => setShowUrgentEmails(true)}
                onReplyNeededClick={() => setShowReplyNeededEmails(true)}
                onPipelineClick={() => setShowSalesHub(true)}
              />
            </div>
          )}

          {/* System status bar — sync status only. Real integration health lives in IntegrationStatusPanel (Agents / System sections). */}
          {!isSarahMode && (
            <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 shadow-xl shadow-black/10 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${loading ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                  {loading ? 'Syncing…' : 'Synced'}
                </span>
                <span className="px-2 py-1 rounded bg-surface-light text-gray-400">
                  {lastRefresh ? new Date(lastRefresh).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'unknown'}
                </span>
                <span className="text-gray-600 hidden sm:inline">|</span>
                <span className="hidden sm:inline text-gray-500">
                  Live integration health → Agents / System tab
                </span>
                <button onClick={() => refresh()} className="ml-auto px-2 py-1 rounded bg-work/20 text-work hover:bg-work/30 text-xs">
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Mobile tab nav (hidden on desktop) */}
          <div className="lg:hidden px-4 pt-4">
            <div className="flex bg-surface-light rounded-xl p-1 mb-4">
              <button
                onClick={() => setMobileTab('agents')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${mobileTab === 'agents' ? 'bg-surface text-white shadow-sm' : 'text-gray-500'}`}
              >
                <Cpu className="w-4 h-4" />Agents
              </button>
              <button
                onClick={() => setMobileTab('life')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${mobileTab === 'life' ? 'bg-surface text-white shadow-sm' : 'text-gray-500'}`}
              >
                <Activity className="w-4 h-4" />Life
              </button>
              <button
                onClick={() => setMobileTab('work')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${mobileTab === 'work' ? 'bg-surface text-white shadow-sm' : 'text-gray-500'}`}
              >
                <TrendingUp className="w-4 h-4" />Work
              </button>
            </div>
          </div>

          {/* Mobile content (hidden on desktop) */}
          <div className="lg:hidden px-4 space-y-4">
            {/* Mobile Agents tab */}
            {mobileTab === 'agents' && (
              <div className="space-y-3">
                {((agentStatus?.agents?.length ?? 0) > 0 ? agentStatus!.agents : AGENTS).map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onRefresh={refreshAgents}
                    onOpenDetails={openAgentCommandCenter}
                    telemetryMode={agentStatus?.meta?.telemetryMode === 'simulated' ? 'simulated' : 'live'}
                  />
                ))}
              </div>
            )}
            {/* Mobile Life tab */}
            {mobileTab === 'life' && (
              <div className="space-y-4">
                <HomeAssistantCard />
                <UnifiedMovieCard />
                <DateNightMemoryBankCard />
              </div>
            )}
            {/* Mobile Work tab */}
            {mobileTab === 'work' && (
              <div className="space-y-4">
                <NeedsMatQueue emails={emails} tasks={tasks} calendarEvents={calendarEvents} onOpenTasks={() => setShowTaskModal(true)} onOpenEmails={() => setShowEmailModal(true)} onTaskUpdate={applyTaskPatch} />
                <MergedCalendarCard />
                <EmailCard />
                <PipelineSheetCard />
                <LucraCommissionCard />
                <TaskPanel tasks={tasks} loading={tasksLoading} onViewDetails={() => setShowTaskModal(true)} />
              </div>
            )}
          </div>

          {/* Desktop section panels (hidden on mobile) */}
          <div className="hidden lg:block p-4 max-w-[1680px]">

            {/* WORK */}
            {desktopSection === 'work' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <NeedsMatQueue emails={emails} tasks={tasks} calendarEvents={calendarEvents} onOpenTasks={() => setShowTaskModal(true)} onOpenEmails={() => setShowEmailModal(true)} onTaskUpdate={applyTaskPatch} />
                  <MergedCalendarCard />
                  <EmailCard />
                </div>
                <div className="space-y-4">
                  <PipelineSheetCard />
                  <LucraCommissionCard />
                  <TaskPanel tasks={tasks} loading={tasksLoading} onViewDetails={() => setShowTaskModal(true)} />
                </div>
              </div>
            )}

            {/* LUCRA */}
            {desktopSection === 'lucra' && (
              <LucraDashboard pipelineARR={(pipeline?.total || 0) * 12} />
            )}

            {/* AGENTS */}
            {desktopSection === 'agents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Agent Fleet</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{agentStatus?.openclaw?.sessions || 0} sessions</span>
                    <button onClick={refreshAgents} className="p-1 hover:bg-surface-light rounded">
                      <RefreshCw className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
                {agentStatus?.meta?.telemetryMode === 'simulated' && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-200">
                    Agent telemetry is simulated for preview.
                  </div>
                )}
                {/* War Room launcher */}
                <a
                  href="https://warroom.thematweiss.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl px-4 py-3 hover:border-orange-400/60 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏟️</span>
                    <div>
                      <div className="font-semibold text-sm text-white">War Room</div>
                      <div className="text-xs text-gray-400">Live chat with the coaching staff</div>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 font-medium group-hover:text-orange-300">Open →</span>
                </a>

                <div className="grid grid-cols-2 gap-3">
                  {((agentStatus?.agents?.length ?? 0) > 0 ? agentStatus!.agents : AGENTS).map((agent: any) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => openAgentCommandCenter(agent)}
                      className="flex items-center gap-3 w-full bg-surface border border-border rounded-xl px-4 py-3 hover:border-gray-600 transition-colors text-left"
                    >
                      <span className="text-xl flex-shrink-0">{agent.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white truncate">{agent.name}</span>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            agent.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                            agent.status === 'idle' ? 'bg-green-500' :
                            agent.status === 'error' ? 'bg-red-500' :
                            'bg-gray-600'
                          }`} />
                        </div>
                        <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <IntegrationStatusPanel />
                  <CronPanel />
                </div>
              </div>
            )}

            {/* LIFE */}
            {desktopSection === 'life' && (
              <div className="grid grid-cols-2 gap-4">
                <HomeAssistantCard />
                <UnifiedMovieCard />
                <DateNightMemoryBankCard />
              </div>
            )}

            {/* SYSTEM */}
            {desktopSection === 'system' && (
              <div className="space-y-4">
                <SessionTree sessions={agentStatus?.sessionTree || []} />
                <div className="grid grid-cols-3 gap-4">
                  <DocumentRepository />
                  <CronPanel />
                  <IntegrationStatusPanel />
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          <button 
            onClick={() => {
              setMobileTab('agents');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              mobileTab === 'agents' ? 'bg-surface-light' : ''
            }`}
          >
            <Cpu className={`w-5 h-5 ${mobileTab === 'agents' ? 'text-work' : 'text-gray-400'}`} />
            <span className={`text-[10px] ${mobileTab === 'agents' ? 'text-white' : 'text-gray-400'}`}>Agents</span>
          </button>

          <button 
            onClick={() => {
              setMobileTab('life');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              mobileTab === 'life' ? 'bg-surface-light' : ''
            }`}
          >
            <Activity className={`w-5 h-5 ${mobileTab === 'life' ? 'text-green-400' : 'text-gray-400'}`} />
            <span className={`text-[10px] ${mobileTab === 'life' ? 'text-white' : 'text-gray-400'}`}>Life</span>
          </button>

          <button 
            onClick={() => setShowQuickActions(true)}
            className="flex flex-col items-center justify-center w-12 h-12 -mt-4 bg-work rounded-full shadow-lg shadow-work/30"
          >
            <Zap className="w-6 h-6 text-white" />
          </button>

          <button 
            onClick={() => {
              setMobileTab('work');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              mobileTab === 'work' ? 'bg-surface-light' : ''
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${mobileTab === 'work' ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span className={`text-[10px] ${mobileTab === 'work' ? 'text-white' : 'text-gray-400'}`}>Work</span>
          </button>

          <button 
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
          >
            <Command className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Cmd</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Needs Mat Queue
//
// Live attention sources (this sprint):
// - Paperclip blocked tasks (rawStatus === 'blocked')
// - Paperclip tasks whose title/description mentions approval, Mat, decision, blocker, review
// - High-priority active tasks (especially unassigned)
// - Stale in_progress tasks (no update in > 72 hours)
// - Gmail URGENT / REPLY_NEEDED categories (via email_categories Supabase table)
// - Calendar events within the next 36 hours (via calendar_events Supabase table)
//
// Not-yet-connected sources are listed under "Coming soon" instead of being faked.
const APPROVAL_REGEX = /\b(approve|approval|approvals|needs mat|for mat|decision|blocker|blocked|sign[- ]?off|review[- ]?ready)\b/i;
const STALE_IN_PROGRESS_MS = 72 * 60 * 60 * 1000;

function NeedsMatQueue({ emails, tasks, calendarEvents, onOpenTasks, onOpenEmails, onTaskUpdate }: any) {
  const now = Date.now();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runTaskAction = async (taskId: string, patch: Record<string, unknown>, queueItemId: string) => {
    if (!taskId) return;
    setPendingActionId(queueItemId);
    setActionError(null);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Paperclip returned ${res.status}`);
      if (data.task && typeof onTaskUpdate === 'function') onTaskUpdate(data.task);
    } catch (err: any) {
      setActionError(err?.message || 'Action failed');
    } finally {
      setPendingActionId(null);
    }
  };

  const activeTasks: any[] = (tasks || []).filter((t: any) => t.status !== 'completed');

  const blockedTasks = activeTasks.filter((task: any) => {
    const rawStatus = String(task.rawStatus || task.status || '').toLowerCase();
    if (rawStatus === 'blocked') return true;
    const text = `${task.title || ''} ${task.description || ''}`;
    return APPROVAL_REGEX.test(text);
  });

  const highTasks = activeTasks
    .filter((task: any) => task.priority === 'high')
    .sort((a: any, b: any) => Number(!a.assignee) - Number(!b.assignee));

  const staleInProgress = activeTasks.filter((task: any) => {
    const rawStatus = String(task.rawStatus || task.status || '').toLowerCase();
    if (rawStatus !== 'in_progress') return false;
    const stamp = task.updatedAt || task.lastActivityAt;
    if (!stamp) return false;
    const ts = new Date(stamp).getTime();
    return Number.isFinite(ts) && now - ts > STALE_IN_PROGRESS_MS;
  });

  const replyEmails = (emails || []).filter((email: any) =>
    ['URGENT', 'REPLY_NEEDED'].includes(email.category)
  );
  const prepEvents = (calendarEvents || []).filter((event: any) => {
    const start = new Date(event.start || event.start_time || event.startTime || event.date).getTime();
    return Number.isFinite(start) && start >= now && start - now <= 36 * 60 * 60 * 1000;
  });

  const queue = [
    ...replyEmails.slice(0, 3).map((email: any) => ({
      id: `email-${email.id || email.message_id || email.subject}`,
      type: email.category === 'URGENT' ? 'urgent email' : 'reply needed',
      title: email.subject || 'Email needs review',
      detail: email.from_name || email.from_email || 'Gmail',
      tone: email.category === 'URGENT' ? 'red' : 'pink',
      action: onOpenEmails,
      href: undefined,
    })),
    ...blockedTasks.slice(0, 5).map((task: any) => ({
      id: `blocked-${task.id}`,
      type: 'decision / blocker',
      title: task.title,
      detail: task.assignee ? `${task.assignee}${task.project ? ` • ${task.project}` : ''}` : task.project || task.identifier || 'Paperclip',
      tone: 'yellow',
      action: onOpenTasks,
      href: task.url,
      task,
    })),
    ...highTasks.slice(0, 4).map((task: any) => ({
      id: `high-${task.id}`,
      type: task.assignee ? 'high priority task' : 'high · unassigned',
      title: task.title,
      detail: task.assignee
        ? `${task.assignee}${task.dueDate ? ` • due ${task.dueDate}` : ''}`
        : `Unassigned${task.identifier ? ` • ${task.identifier}` : ''}`,
      tone: task.assignee ? 'orange' : 'red',
      action: onOpenTasks,
      href: task.url,
      task,
    })),
    ...staleInProgress.slice(0, 3).map((task: any) => ({
      id: `stale-${task.id}`,
      type: 'stale in progress',
      title: task.title,
      detail: `${task.assignee || 'Unassigned'} • last update ${task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'unknown'}`,
      tone: 'yellow',
      action: onOpenTasks,
      href: task.url,
      task,
    })),
    ...prepEvents.slice(0, 3).map((event: any) => ({
      id: `event-${event.id || event.summary}`,
      type: 'calendar prep',
      title: event.summary || 'Upcoming event',
      detail: new Date(event.start || event.start_time || event.startTime || event.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      tone: 'cyan',
      action: undefined,
      href: undefined,
    })),
  ].slice(0, 10);

  const counts = {
    emails: replyEmails.length,
    blockers: blockedTasks.length,
    high: highTasks.length,
    stale: staleInProgress.length,
    events: prepEvents.length,
  };

  const toneClasses: Record<string, string> = {
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    pink: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  };

  return (
    <div className="bg-surface border border-orange-500/20 rounded-xl overflow-hidden shadow-lg shadow-orange-500/5">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Needs Mat</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/20">
              {queue.length} open
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Live Paperclip blockers, high-priority work, stale items, replies, and prep — no demo data.</p>
        </div>
        <button onClick={onOpenTasks} className="text-xs text-orange-300 hover:text-orange-200">Open board →</button>
      </div>

      <div className="grid grid-cols-5 border-b border-border text-center text-xs">
        <div className="py-2"><div className="font-mono text-white">{counts.emails}</div><div className="text-gray-500">Emails</div></div>
        <div className="py-2"><div className="font-mono text-white">{counts.blockers}</div><div className="text-gray-500">Blockers</div></div>
        <div className="py-2"><div className="font-mono text-white">{counts.high}</div><div className="text-gray-500">High</div></div>
        <div className="py-2"><div className="font-mono text-white">{counts.stale}</div><div className="text-gray-500">Stale</div></div>
        <div className="py-2"><div className="font-mono text-white">{counts.events}</div><div className="text-gray-500">Prep</div></div>
      </div>

      {actionError && (
        <div className="mx-3 mt-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {actionError}
        </div>
      )}

      <div className="p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            <CheckCircle className="w-7 h-7 mx-auto mb-2 text-green-400/70" />
            Nothing needs Mat right now.
          </div>
        ) : queue.map((item: any) => {
          const rowClasses = 'w-full rounded-lg border border-border bg-surface-light/70 p-3 transition-colors hover:border-orange-500/30';
          const headerAndBody = (
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${toneClasses[item.tone] || toneClasses.orange}`}>
                    {item.type}
                  </span>
                </div>
                <div className="text-sm text-white truncate">{item.title}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{item.detail}</div>
              </div>
              <Clock className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
            </div>
          );

          // Paperclip-backed items get inline actions. Wrap in a non-button
          // container so the action buttons (and the open-in-Paperclip link)
          // aren't nested inside a parent <button>/<a>.
          if (item.task) {
            const task = item.task;
            const isBlocked = String(task.rawStatus || task.status || '').toLowerCase() === 'blocked';
            const inFlight = pendingActionId === item.id;
            return (
              <div key={item.id} className={rowClasses}>
                {headerAndBody}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {isBlocked ? (
                    <button
                      disabled={inFlight}
                      onClick={() => runTaskAction(task.id, { status: 'in_progress' }, item.id)}
                      className="text-[11px] rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      {inFlight ? 'Unblocking…' : 'Unblock'}
                    </button>
                  ) : (
                    <button
                      disabled={inFlight}
                      onClick={() => runTaskAction(task.id, { status: 'done' }, item.id)}
                      className="text-[11px] rounded border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-300 hover:bg-green-500/20 disabled:opacity-50"
                    >
                      {inFlight ? 'Saving…' : 'Mark done'}
                    </button>
                  )}
                  {task.priority !== 'low' && (
                    <button
                      disabled={inFlight}
                      onClick={() => runTaskAction(task.id, { priority: 'low' }, item.id)}
                      className="text-[11px] rounded border border-gray-500/30 bg-white/[0.03] px-2 py-1 text-gray-300 hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      Lower priority
                    </button>
                  )}
                  {item.href && (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[11px] text-orange-300 hover:text-orange-200"
                    >
                      Open in Paperclip ↗
                    </a>
                  )}
                </div>
              </div>
            );
          }

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block text-left ${rowClasses}`}
              >
                {headerAndBody}
              </a>
            );
          }
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`text-left ${rowClasses}`}
            >
              {headerAndBody}
            </button>
          );
        })}
      </div>

      <div className="px-3 pb-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-snug text-gray-500">
          <div className="font-medium text-gray-400 mb-1">Coming soon</div>
          <div>Agent draft-approval queue, Hermes email draft approvals, and Granola action-item routing are not yet wired in. When sources land they will appear here automatically.</div>
        </div>
      </div>
    </div>
  );
}

// Task Panel
function TaskPanel({ tasks: taskList, loading, onViewDetails }: any) {
  const taskCounts = {
    high: taskList.filter((t: any) => t.priority === 'high' && t.status !== 'completed').length,
    medium: taskList.filter((t: any) => t.priority === 'medium' && t.status !== 'completed').length,
    low: taskList.filter((t: any) => t.priority === 'low' && t.status !== 'completed').length,
  };

  const taskNames = {
    high: taskList.filter((t: any) => t.priority === 'high' && t.status !== 'completed').map((t: any) => t.title),
    medium: taskList.filter((t: any) => t.priority === 'medium' && t.status !== 'completed').map((t: any) => t.title),
    low: taskList.filter((t: any) => t.priority === 'low' && t.status !== 'completed').map((t: any) => t.title),
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-gray-600 transition-colors" onClick={onViewDetails}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Tasks</h2>
          {loading && <span className="text-xs text-gray-600 animate-pulse">loading…</span>}
          {!loading && <span className="text-xs text-gray-600">Paperclip</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded hover:bg-orange-500/30"
        >
          + New
        </button>
      </div>
      
      <div className="p-4 grid grid-cols-3 gap-3">
        {Object.entries(taskCounts).map(([priority, count]: [string, any]) => (
          <div key={priority} className={`border rounded-lg p-3 ${
            priority === 'high' ? 'border-red-500/30' :
            priority === 'medium' ? 'border-yellow-500/30' :
            'border-green-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                priority === 'high' ? 'bg-red-500' :
                priority === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="text-xs font-medium uppercase">{priority}</span>
              <span className="text-xs text-gray-500">({count})</span>
            </div>
            <div className="space-y-1">
              {taskNames[priority as keyof typeof taskNames].slice(0, 2).map((task: string, i: number) => (
                <div key={i} className="text-xs text-gray-400 truncate">{task}</div>
              ))}
              {(taskNames[priority as keyof typeof taskNames].length > 2) && (
                <div className="text-xs text-gray-600">+{taskNames[priority as keyof typeof taskNames].length - 2} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cron Panel — live OpenClaw cron jobs via /api/cron/jobs (`openclaw cron list --json`).
interface CronJobRow {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: string;
  timezone: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
  consecutiveErrors: number;
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '—';
  const delta = ms - Date.now();
  const abs = Math.abs(delta);
  const past = delta < 0;
  const minutes = Math.round(abs / 60000);
  if (minutes < 1) return past ? 'just now' : 'imminent';
  if (minutes < 60) return past ? `${minutes}m ago` : `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return past ? `${hours}h ago` : `in ${hours}h`;
  const days = Math.round(hours / 24);
  return past ? `${days}d ago` : `in ${days}d`;
}

function CronPanel() {
  const [jobs, setJobs] = useState<CronJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/cron/jobs');
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setJobs(Array.isArray(data.jobs) ? data.jobs : []);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'failed to load cron jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const visible = jobs.slice(0, 8);
  const disabledCount = jobs.filter((j) => !j.enabled).length;
  const errorCount = jobs.filter((j) => j.consecutiveErrors > 0).length;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Scheduled Operations</h2>
        <span className="text-[10px] text-gray-500 font-mono">
          {loading ? 'loading…' : `${jobs.length} jobs${disabledCount ? ` · ${disabledCount} off` : ''}${errorCount ? ` · ${errorCount} erroring` : ''}`}
        </span>
      </div>

      {error && (
        <div className="mb-2 text-xs text-yellow-400">
          Cron telemetry unavailable: {error}
        </div>
      )}

      <div className="space-y-2">
        {!loading && jobs.length === 0 && !error && (
          <div className="text-xs text-gray-500">No cron jobs scheduled.</div>
        )}
        {visible.map((job) => {
          const ok = (job.lastStatus || '').toLowerCase() === 'ok';
          const erroring = job.consecutiveErrors > 0;
          const dot = !job.enabled
            ? 'bg-gray-600'
            : erroring
              ? 'bg-red-500'
              : ok
                ? 'bg-green-500'
                : 'bg-gray-500';
          return (
            <div key={job.id} className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-gray-500 w-20 text-xs">{formatRelativeTime(job.nextRunAt)}</span>
              <span className="flex-1 truncate">{job.name}</span>
              <span className={`text-xs ${erroring ? 'text-red-400' : ok ? 'text-green-500' : 'text-gray-500'}`}>
                {!job.enabled ? 'disabled' : erroring ? `${job.consecutiveErrors}×err` : job.lastStatus || 'pending'}
              </span>
            </div>
          );
        })}
        {jobs.length > visible.length && (
          <div className="text-[11px] text-gray-500">+{jobs.length - visible.length} more cron jobs</div>
        )}
      </div>
    </div>
  );
}

