import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Activity, Mail, Database, Cpu, Sparkles,
  Zap, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, RefreshCw, MoreHorizontal, CreditCard,
  Command, Search, Settings, Bell, HardDrive, Reply, X,
  Briefcase, Bot, Leaf, Cog
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

// Agent configuration - real Paperclip roster
const AGENTS = [
  // Level 1: CEO
  { id: 'a0edadcb-f994-40e3-a9a1-d3ffde595c3e', name: 'Clawd', emoji: '🦞', color: 'work', role: 'CEO & Orchestrator', level: 1, status: 'running' as const, lastActive: new Date().toISOString() },
  // Level 2: Department leads
  { id: '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8', name: 'Vandalay', emoji: '📈', color: 'vandalay', role: 'Chief Strategy Officer', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: '1ef5e05b-7a16-4ebc-8c05-cdb03a321197', name: 'Sloan', emoji: '📋', color: 'sloan', role: 'Chief of Staff', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: 'fd4efc78-5969-47f3-878a-457654682548', name: 'Bob', emoji: '🔧', color: 'build', role: 'Head of Build', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: '8c40bdd4-7e82-40a7-9fa7-982b0931d705', name: 'Luke', emoji: '💼', color: 'work', role: 'Sales & Lucra Ops', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: 'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6', name: 'Sage', emoji: '🌿', color: 'lifestyle', role: 'Personal & Lifestyle', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  // Level 3: Specialists
  { id: 'e6822182-3611-4152-a1f2-aab9975fce3d', name: 'Hermes', emoji: '✉️', color: 'email', role: 'Google Workspace Ops', level: 3, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: 'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f', name: 'Scout', emoji: '🔍', color: 'research', role: 'Research & Intelligence', level: 3, status: 'error' as const, lastActive: new Date(Date.now() - 3600000).toISOString() },
  { id: '951c871e-fcb0-4211-bf92-19b0812d16bd', name: 'Pixel', emoji: '🌐', color: 'hubspot', role: 'Browser & Scheduling', level: 3, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: '61ee0d8e-ac57-47bc-8402-5d3a756427ad', name: 'Arty', emoji: '🎨', color: 'arty', role: 'Art & Shopify Ops', level: 3, status: 'error' as const, lastActive: new Date(Date.now() - 3600000).toISOString() },
];

const STAGE_COLORS: any = {
  'Qualification': 'text-orange-400',
  'Discovery': 'text-blue-400',
  'Evaluation': 'text-purple-400',
  'Confirmation': 'text-green-400',
  'Negotiation': 'text-red-400',
};

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
    setSelectedAgent({
      agent_id: agent.id,
      status: agent.status,
      updated_at: agent.lastActive,
      // success_rate is intentionally null — telemetry source isn't wired yet.
      // AgentCommandCenter renders "live / unavailable" instead of a fake percentage.
      success_rate: null,
      last_task: agent.role,
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

  const urgentEmails = emails.filter(e => e.category === 'URGENT');
  const replyNeededEmails = emails.filter(e => e.category === 'REPLY_NEEDED');
  const fyiEmails = emails.filter(e => e.category === 'FYI');

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

  const closingThisWeek = pipeline.deals.filter((d: any) => {
    if (!d.closeDate) return false;
    const close = new Date(d.closeDate);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return close <= weekFromNow;
  });

  const todayBoard = {
    urgentEmails: urgentEmails.length,
    dueTasks: tasks.filter((t: any) => t.status !== 'completed').length,
    nextEvent: calendarEvents?.[0]?.title || 'No upcoming events',
    nextAction: tasks.find((t: any) => t.status !== 'completed')?.title || 'No pending tasks',
  };

  const amexUsedYtd = amexBenefits.reduce((sum: number, b: any) => sum + Number(b.usedAmount || 0), 0);
  const amexEstimatedCap = amexBenefits.reduce((sum: number, b: any) => sum + Number(b.annualCap || b.periodCap || 0), 0);
  const amexUnusedCount = amexBenefits.filter((b: any) => b.status === 'unused').length;

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

          {/* System status bar */}
          {!isSarahMode && (
            <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2 shadow-xl shadow-black/10 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${loading ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                  {loading ? 'Syncing…' : 'Healthy'}
                </span>
                <span className="px-2 py-1 rounded bg-surface-light text-gray-400">
                  {lastRefresh ? new Date(lastRefresh).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'unknown'}
                </span>
                <span className="text-gray-600">|</span>
                <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Core: Green</span>
                <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Composio: Green</span>
                <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">GitHub: Green</span>
                <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">GroqCloud: Yellow</span>
                <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">OpenRouter: Yellow</span>
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
                <NeedsMatQueue emails={emails} tasks={tasks} calendarEvents={calendarEvents} onOpenTasks={() => setShowTaskModal(true)} onOpenEmails={() => setShowEmailModal(true)} />
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
                  <NeedsMatQueue emails={emails} tasks={tasks} calendarEvents={calendarEvents} onOpenTasks={() => setShowTaskModal(true)} onOpenEmails={() => setShowEmailModal(true)} />
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

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
    </div>
  );
}

// Email Panel
function EmailPanel({ urgent, replyNeeded, fyiCount, onViewDetails }: any) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Email Intelligence</h2>
        <button 
          onClick={onViewDetails}
          className="text-xs text-pink-500 hover:underline"
        >
          View All
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {urgent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>URGENT ({urgent.length})</span>
            </div>
            {urgent.slice(0, 2).map((email: any, i: number) => (
              <div key={i} className="bg-surface-light rounded-lg p-3 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{email.from_name || email.from_email}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(email.received_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{email.subject}</p>
                {email.deal_name && (
                  <span className="inline-block mt-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                    {email.deal_name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {replyNeeded.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>Reply Needed ({replyNeeded.length})</span>
            </div>
            {replyNeeded.slice(0, 2).map((email: any, i: number) => (
              <div key={i} className="bg-surface-light rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{email.from_name || email.from_email}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(email.received_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">{email.subject}</p>
              </div>
            ))}
          </div>
        )}

        {fyiCount > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-gray-500">{fyiCount} FYI emails</span>
          </div>
        )}

        {urgent.length === 0 && replyNeeded.length === 0 && fyiCount === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No emails processed yet</p>
            <p className="text-xs mt-1">Email Agent will populate this</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border flex gap-2">
        <a
          href="https://mail.google.com/mail/u/0/#search/is:unread"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 text-xs bg-surface-light hover:bg-border rounded transition-colors text-center"
        >
          Mark FYI Read
        </a>
        <a
          href="https://mail.google.com/mail/u/0/#compose"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 text-xs bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 rounded transition-colors text-center"
        >
          Draft Response
        </a>
      </div>
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

function NeedsMatQueue({ emails, tasks, calendarEvents, onOpenTasks, onOpenEmails }: any) {
  const now = Date.now();

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
    })),
    ...staleInProgress.slice(0, 3).map((task: any) => ({
      id: `stale-${task.id}`,
      type: 'stale in progress',
      title: task.title,
      detail: `${task.assignee || 'Unassigned'} • last update ${task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'unknown'}`,
      tone: 'yellow',
      action: onOpenTasks,
      href: task.url,
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

      <div className="p-3 space-y-2">
        {queue.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            <CheckCircle className="w-7 h-7 mx-auto mb-2 text-green-400/70" />
            Nothing needs Mat right now.
          </div>
        ) : queue.map((item: any) => {
          const inner = (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left rounded-lg border border-border bg-surface-light/70 p-3 hover:border-orange-500/30 transition-colors"
              >
                {inner}
              </a>
            );
          }
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full text-left rounded-lg border border-border bg-surface-light/70 p-3 hover:border-orange-500/30 transition-colors"
            >
              {inner}
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

// Cron Panel
function CronPanel() {
  const jobs = [
    { time: '8:00 AM', name: 'Morning Briefing', status: 'completed' },
    { time: 'NOW', name: 'Email Agent Check', status: 'running' },
    { time: '12:00 PM', name: 'Pre-Meeting Prep', status: 'pending' },
    { time: '4:00 PM', name: 'HubSpot Cache Refresh', status: 'pending' },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Scheduled Operations</h2>
      
      <div className="space-y-2">
        {jobs.map((job, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              job.status === 'completed' ? 'bg-green-500' :
              job.status === 'running' ? 'bg-yellow-500 animate-pulse' :
              'bg-gray-600'
            }`} />
            <span className="text-gray-500 w-16 text-xs">{job.time}</span>
            <span className="flex-1">{job.name}</span>
            <span className={`text-xs capitalize ${
              job.status === 'completed' ? 'text-green-500' :
              job.status === 'running' ? 'text-yellow-500' :
              'text-gray-500'
            }`}>
              {job.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pipeline Panel
function PipelinePanel({ pipeline, closingThisWeek, onViewDetails }: any) {
  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}K`;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sales Pipeline</h2>
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </div>
      
      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{pipeline.deals.length}</div>
            <div className="text-xs text-gray-500">Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-cyan-400">{formatCurrency(pipeline.total)}</div>
            <div className="text-xs text-gray-500">Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-green-400">{closingThisWeek.length}</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
        </div>

        {/* By Stage */}
        <div className="space-y-2 mb-4">
          {Object.entries(pipeline.byStage).map(([stage, data]: [string, any]) => (
            <div key={stage} className="flex items-center justify-between text-xs">
              <span className={`${STAGE_COLORS[stage] || 'text-gray-400'}`}>{stage}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-500">{data.count} deals</span>
                <span className="font-mono text-gray-300">{formatCurrency(data.value)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Closing Soon */}
        {closingThisWeek.length > 0 && (
          <div className="border-t border-border pt-3 mb-3">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Closing This Week</span>
            </div>
            {closingThisWeek.map((deal: any, i: number) => (
              <div key={i} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{deal.name}</span>
                  <span className="text-sm font-mono font-bold">{formatCurrency(deal.amount)}</span>
                </div>
                <div className="text-xs text-red-400 mt-1">
                  {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {new Date(deal.closeDate) <= new Date() && new Date(deal.closeDate).toDateString() === new Date().toDateString() && ' (TODAY)'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stale Deals - disabled, table doesn't exist */}
        {false && (
          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-2 text-yellow-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Stale Deals</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border flex gap-2">
        <button 
          onClick={onViewDetails}
          className="flex-1 py-2 text-xs bg-surface-light hover:bg-border rounded transition-colors"
        >
          View Pipeline
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="flex-1 py-2 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

// API Health Panel
function ApiHealthPanel() {
  const services = [
    { name: 'HubSpot', status: 'connected', latency: 245 },
    { name: 'Calendar', status: 'connected', latency: 189 },
    { name: 'Gmail', status: 'connected', latency: 156 },
    { name: 'Supabase', status: 'connected', latency: 89 },
    { name: 'ElevenLabs', status: 'connected', latency: 334 },
    { name: 'SearXNG', status: 'connected', latency: 120 },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Integration Status</h2>
      
      <div className="grid grid-cols-2 gap-2">
        {services.map((svc, i) => (
          <div key={i} className="flex items-center justify-between bg-surface-light rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${svc.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs">{svc.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{svc.latency}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Panel
function ActivityPanel({ activities }: any) {
  const icons: any = {
    'email-agent': Mail,
    'hubspot-agent': Database,
    'work-agent': Cpu,
    'build-agent': Zap,
    'research-agent': Search,
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Events</h2>
      </div>
      
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {activities.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No recent activity</p>
          </div>
        )}
        
        {activities.slice(0, 10).map((activity: any, i: number) => {
          const Icon = icons[activity.agent] || Activity;
          const timeAgo = activity.created_at 
            ? new Date(activity.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '';
          
          return (
            <div key={i} className="flex items-start gap-3 text-xs">
              <Icon className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 capitalize">{activity.agent?.replace('-agent', '')}</span>
                  <span className="text-gray-600">{timeAgo}</span>
                </div>
                <p className="text-gray-300">{activity.action}</p>
              </div>
              {activity.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
              {activity.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
