import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Activity, Mail, Database, Cpu, Sparkles, 
  Zap, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, RefreshCw, MoreHorizontal, CreditCard,
  Command, Search, Settings, Bell, HardDrive, Reply, X
} from 'lucide-react';
import { useCommandPalette, useRealtimeData, useAgentActions } from '../hooks/useMissionControl';
import { useAgentStatus } from '../hooks/useAgentStatus';
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
import LucraROICalculatorCard from '../components/LucraROICalculatorCard';
import { LifestyleGoalTrackerCard } from '../components/LifestyleGoalTrackerCard';
import { UnifiedMovieCard } from '../components/UnifiedMovieCard';
import { YogaCard } from '../components/YogaCard';
import { DateNightMemoryBankCard } from '../components/DateNightMemoryBankCard';
import { TravelPrepAssistantCard } from '../components/TravelPrepAssistantCard';
import { RecommendationsCard } from '../components/RecommendationsCard';
import { HeroSection } from '../components/HeroSection';
import { QuickStatsBar } from '../components/QuickStatsBar';
import { TodayNeedsAttention } from '../components/TodayNeedsAttention';
import { SmartRecommendationsV2 } from '../components/SmartRecommendationsV2';
import { WeekendPlannerCard } from '../components/WeekendPlannerCard';
import { NotificationCenter } from '../components/NotificationCenter';
import { ErrandsOptimizerCard } from '../components/ErrandsOptimizerCard';
import { FirstTimeCollectorLadderCard } from '../components/FirstTimeCollectorLadderCard';
import { CollectorReengagementRadarCard } from '../components/CollectorReengagementRadarCard';
import { AnimatedCard, StaggerContainer, StaggerItem, FadeIn, SlideIn } from '../components/animations';

// Agent configuration - 3-Tier Architecture
const AGENTS = [
  // Level 1: Director (You)
  { id: 'clawd-prime', name: 'CLAWD Prime', emoji: '🦞', color: 'work', role: 'Director & Orchestrator', level: 1, status: 'running' as const, lastActive: new Date().toISOString() },
  
  // Level 2: Directors
  { id: 'work-agent', name: 'Work Agent', emoji: '🤖', color: 'work', role: 'Sales & Business Operations', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: 'lifestyle-agent', name: 'Lifestyle Agent', emoji: '🧘', color: 'lifestyle', role: 'Wellness & Life Balance', level: 2, status: 'idle' as const, lastActive: new Date().toISOString() },
  { id: 'build-agent', name: 'Build Agent', emoji: '🔧', color: 'build', role: 'Engineering & Infrastructure', level: 2, status: 'running' as const, lastActive: new Date().toISOString() },
  
  // Level 3: Specialists
  { id: 'email-agent', name: 'Email Agent', emoji: '📧', color: 'email', role: 'Inbox Monitor → Work Agent', level: 3, status: 'offline' as const, lastActive: new Date(Date.now() - 86400000).toISOString() },
  { id: 'hubspot-agent', name: 'HubSpot Agent', emoji: '📊', color: 'hubspot', role: 'CRM Data → Work Agent', level: 3, status: 'offline' as const, lastActive: new Date(Date.now() - 86400000).toISOString() },
  { id: 'research-agent', name: 'Research Agent', emoji: '🔍', color: 'research', role: 'Intelligence Gathering', level: 3, status: 'weekend' as const, lastActive: new Date(Date.now() - 172800000).toISOString() },
];

const STAGE_COLORS: any = {
  'Qualification': 'text-orange-400',
  'Discovery': 'text-blue-400',
  'Evaluation': 'text-purple-400',
  'Confirmation': 'text-green-400',
  'Negotiation': 'text-red-400',
};

export default function MissionControl() {
  const { isOpen, setIsOpen } = useCommandPalette();
  const { spawnAgent, refreshAgent, restartAgent } = useAgentActions();
  const { 
    emails, pipeline, calendarEvents,
    loading, lastRefresh, refresh 
  } = useRealtimeData();
  const { data: agentStatus, refresh: refreshAgents } = useAgentStatus();

  const openAgentCommandCenter = (agent: any) => {
    setSelectedAgent({
      agent_id: agent.id,
      status: agent.status,
      updated_at: agent.lastActive,
      success_rate: agent.status === 'error' ? 62 : agent.status === 'running' ? 96 : 88,
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
  const [priorityMode, setPriorityMode] = useState(false);
  const [showUrgentEmails, setShowUrgentEmails] = useState(false);
  const [showReplyNeededEmails, setShowReplyNeededEmails] = useState(false);

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

  const [tasks, setTasks] = useState<any[]>([
    { id: '1', title: 'Finalize HAP walkaway', priority: 'high' as const, status: 'pending' as const },
    { id: '2', title: 'Update Rodrigo contract', priority: 'high' as const, status: 'in_progress' as const },
    { id: '3', title: 'Update Chubby CPay pricing', priority: 'medium' as const, status: 'pending' as const },
    { id: '4', title: 'Create GFG rollout', priority: 'medium' as const, status: 'pending' as const },
    { id: '5', title: 'Wellness check', priority: 'low' as const, status: 'completed' as const },
    { id: '6', title: 'Research cache review', priority: 'low' as const, status: 'pending' as const },
  ]);

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

  // Persist tasks in localStorage (shared key with mobile tab) so user-added
  // tasks survive refresh/restart and stay in sync across dashboard views.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const shared = localStorage.getItem('mission-control-tasks');
      const legacyDesktop = localStorage.getItem('mission-control-desktop-tasks');
      const saved = shared || legacyDesktop;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
          // one-time migration from old desktop-only key to shared key
          if (!shared) {
            localStorage.setItem('mission-control-tasks', JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.error('Failed to load dashboard tasks:', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('mission-control-tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save dashboard tasks:', e);
    }
  }, [tasks]);

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
    <div className="min-h-screen bg-background text-white">
      <Head>
        <title>Clawd Mission Control</title>
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
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦞</span>
            <div>
              <h1 className="font-bold text-base lg:text-lg">Clawd Mission Control</h1>
              <p className="text-xs text-gray-400 hidden sm:block">AI Agent Command Center</p>
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
              className="flex items-center gap-2 px-3 py-1.5 bg-surface-light hover:bg-border rounded-lg transition-colors text-sm"
            >
              <Command className="w-4 h-4" />
              <span className="hidden sm:inline">Command</span>
              <span className="text-xs text-gray-500 hidden sm:inline">⌘K</span>
            </button>
            
            <button 
              onClick={refresh}
              disabled={loading}
              className={`p-2 hover:bg-surface-light rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <NotificationCenter />

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

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-4 pb-24 lg:pb-4">
        {activeAction && (
          <div className="mb-4 px-4 py-2 bg-work/20 border border-work/30 rounded-lg text-sm text-work">
            Executing: {activeAction.replace('-', ' ')}
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-4">
          <HeroSection />
        </div>

        {/* Quick Stats Bar */}
        <div className="mb-4 py-2 border-y border-border">
          <QuickStatsBar 
            urgentEmails={emails.filter((e: any) => e.category === 'URGENT').length}
            replyNeededEmails={emails.filter((e: any) => e.category === 'REPLY_NEEDED').length}
            pipelineMRR={`$${((pipeline?.total || 0) / 1000).toFixed(1)}k`}
            pipelineARR={`$${(((pipeline?.total || 0) * 12) / 1000).toFixed(1)}k`}
            yogaClasses={51}
            watchlistCount={0}
            buddyPasses={2}
            buddyPassDays={16}
            onUrgentClick={() => setShowUrgentEmails(true)}
            onReplyNeededClick={() => setShowReplyNeededEmails(true)}
            onPipelineClick={() => setShowSalesHub(true)}
          />
        </div>

        {/* Today Board */}
        <div className="mb-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Today Board</h3>
            <span className="text-xs text-gray-400">Focus mode</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-surface-light px-3 py-2">
              <div className="text-xs text-gray-400">Urgent Emails</div>
              <div className="text-orange-300 font-semibold">{todayBoard.urgentEmails}</div>
            </div>
            <div className="rounded-lg bg-surface-light px-3 py-2">
              <div className="text-xs text-gray-400">Open Tasks</div>
              <div className="text-blue-300 font-semibold">{todayBoard.dueTasks}</div>
            </div>
            <div className="rounded-lg bg-surface-light px-3 py-2">
              <div className="text-xs text-gray-400">Next Event</div>
              <div className="text-white truncate">{todayBoard.nextEvent}</div>
            </div>
            <div className="rounded-lg bg-surface-light px-3 py-2">
              <div className="text-xs text-gray-400">Next Action</div>
              <div className="text-white truncate">{todayBoard.nextAction}</div>
            </div>
          </div>
        </div>

        {/* Reliability / Freshness */}
        <div className="mb-4 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-surface-light text-gray-300">
              Data freshness: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'unknown'}
            </span>
            <span className={`px-2 py-1 rounded ${loading ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
              {loading ? 'Syncing…' : 'Healthy'}
            </span>
            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300">Confidence: Operational</span>
            <button
              onClick={() => refresh()}
              className="px-2 py-1 rounded bg-work/20 text-work hover:bg-work/30"
            >
              Retry refresh
            </button>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mb-4 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">System Status</div>
              <div className="text-xs text-gray-400">Core systems are operational, with a few known warnings still on the board.</div>
              {agentStatus?.meta?.telemetryMode === 'simulated' && (
                <div className="mt-1 text-[11px] text-blue-300">Agent telemetry and session hierarchy are currently simulated for preview.</div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                Core: Green
              </span>
              <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                Composio: Green
              </span>
              <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                GitHub smoke test: Green
              </span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                GroqCloud: Yellow
              </span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                OpenRouter credits: Yellow
              </span>
              <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                Plugin warning: Yellow
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden mb-4">
          <div className="flex bg-surface-light rounded-xl p-1">
            <button
              onClick={() => setMobileTab('agents')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                mobileTab === 'agents' 
                  ? 'bg-surface text-white shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Agents
            </button>
            <button
              onClick={() => setMobileTab('life')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                mobileTab === 'life' 
                  ? 'bg-surface text-white shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              <Activity className="w-4 h-4" />
              Life
            </button>
            <button
              onClick={() => setMobileTab('work')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                mobileTab === 'work' 
                  ? 'bg-surface text-white shadow-sm' 
                  : 'text-gray-500'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Work
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* LEFT: Operations / System */}
          <StaggerContainer className={`space-y-4 ${mobileTab !== 'agents' ? 'hidden lg:block' : ''} ${priorityMode ? 'hidden' : ''}`} staggerDelay={0.05}>
            {!priorityMode && (
              <>
                <StaggerItem>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Agent Fleet</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {agentStatus?.openclaw?.sessions || 0} session{agentStatus?.openclaw?.sessions !== 1 ? 's' : ''}
                      </span>
                      <button 
                        onClick={refreshAgents}
                        className="p-1 hover:bg-surface-light rounded"
                      >
                        <RefreshCw className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </StaggerItem>
                
                <div className="space-y-3">
                  {((agentStatus?.agents?.length ?? 0) > 0 ? agentStatus!.agents : AGENTS).map((agent, idx) => (
                    <StaggerItem key={agent.id}>
                      <AnimatedCard delay={idx * 0.05}>
                        <AgentCard 
                          agent={agent}
                          onRefresh={refreshAgents}
                          onOpenDetails={openAgentCommandCenter}
                          telemetryMode={agentStatus?.meta?.telemetryMode === 'simulated' ? 'simulated' : 'live'}
                        />
                      </AnimatedCard>
                    </StaggerItem>
                  ))}
                </div>

                {/* Consolidated System Panel */}
                <StaggerItem>
                  <AnimatedCard>
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                      <div className="flex border-b border-border">
                        <button
                          onClick={() => setSystemTab('memory')}
                          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                            systemTab === 'memory'
                              ? 'text-white border-b-2 border-work bg-surface-light'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Memory
                        </button>
                        <button
                          onClick={() => setSystemTab('health')}
                          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                            systemTab === 'health'
                              ? 'text-white border-b-2 border-work bg-surface-light'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Health
                        </button>
                        <button
                          onClick={() => setSystemTab('cron')}
                          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
                            systemTab === 'cron'
                              ? 'text-white border-b-2 border-work bg-surface-light'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          Cron
                        </button>
                      </div>
                      <div className="p-3">
                        {systemTab === 'memory' && <DocumentRepository />}
                        {systemTab === 'health' && (
                          <div className="text-center py-8 text-gray-500">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Health integrations coming soon</p>
                            <p className="text-xs mt-1">Apple Health, Fitbit, Oura</p>
                          </div>
                        )}
                        {systemTab === 'cron' && <CronPanel />}
                      </div>
                    </div>
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard>
                    <IntegrationStatusPanel />
                  </AnimatedCard>
                </StaggerItem>
              </>
            )}
          </StaggerContainer>

          {/* CENTER: Life / Presence */}
          <StaggerContainer className={`space-y-4 ${mobileTab !== 'life' ? 'hidden lg:block' : ''} ${priorityMode ? 'lg:col-span-2' : ''}`} staggerDelay={0.08}>
            {!priorityMode && (
              <>
                <StaggerItem>
                  <SectionLabel title="Recent Events" />
                </StaggerItem>
                {agentStatus?.meta?.sessionTreeMode === 'simulated' && (
                  <StaggerItem>
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-200">
                      Session tree is currently simulated to preview orchestration UX. Wire to live OpenClaw session topology next.
                    </div>
                  </StaggerItem>
                )}
                <StaggerItem>
                  <AnimatedCard>
                    <SessionTree sessions={agentStatus?.sessionTree || []} />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard>
                    <SmartRecommendationsV2 />
                  </AnimatedCard>
                </StaggerItem>
                <StaggerItem>
                  <AnimatedCard>
                    <WeekendPlannerCard />
                  </AnimatedCard>
                </StaggerItem>
              </>
            )}

            {priorityMode && (
              <StaggerItem>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Priority Mode Active</span>
                  </div>
                  <p className="text-sm text-red-200 mt-1">Showing only urgent items</p>
                </div>
              </StaggerItem>
            )}

            <StaggerItem>
              <AnimatedCard>
                <HomeAssistantCard />
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard>
                <DateNightMemoryBankCard />
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard>
                <TravelPrepAssistantCard />
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard>
                <ErrandsOptimizerCard />
              </AnimatedCard>
            </StaggerItem>

            {!priorityMode && (
              <>
                <StaggerItem>
                  <AnimatedCard delay={0.1}>
                    <UnifiedMovieCard />
                  </AnimatedCard>
                </StaggerItem>
                <StaggerItem>
                  <AnimatedCard delay={0.15}>
                    <YogaCard />
                  </AnimatedCard>
                </StaggerItem>
              </>
            )}
          </StaggerContainer>

          {/* RIGHT: Work / Execution */}
          <StaggerContainer className={`space-y-4 ${mobileTab !== 'work' ? 'hidden lg:block' : ''} ${priorityMode ? '' : ''}`} staggerDelay={0.06}>
            <StaggerItem>
              <AnimatedCard>
                <MergedCalendarCard />
              </AnimatedCard>
            </StaggerItem>

            <StaggerItem>
              <AnimatedCard delay={0.05}>
                <EmailCard />
              </AnimatedCard>
            </StaggerItem>

            {!priorityMode && (
              <>
                <StaggerItem>
                  <AnimatedCard delay={0.1}>
                    <PipelineSheetCard />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard delay={0.15}>
                    <LucraCommissionCard />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard delay={0.175}>
                    <LucraROICalculatorCard />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard delay={0.2}>
                    <CollectorReengagementRadarCard />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard delay={0.225}>
                    <FirstTimeCollectorLadderCard />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard delay={0.25}>
                    <TaskPanel 
                      tasks={tasks}
                      onViewDetails={() => setShowTaskModal(true)}
                    />
                  </AnimatedCard>
                </StaggerItem>

                <StaggerItem>
                  <AnimatedCard delay={0.275}>
                    <div className="bg-surface border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-300" />
                          <h3 className="text-sm font-semibold">Amex Benefits (Platinum)</h3>
                        </div>
                        <span className="text-xs text-gray-400">MVP</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                        <div className="bg-surface-light rounded-lg p-2">
                          <div className="text-gray-400">Tracked</div>
                          <div className="text-white font-semibold">{amexBenefits.length}</div>
                        </div>
                        <div className="bg-surface-light rounded-lg p-2">
                          <div className="text-gray-400">Used YTD</div>
                          <div className="text-green-300 font-semibold">${amexUsedYtd.toFixed(2)}</div>
                        </div>
                        <div className="bg-surface-light rounded-lg p-2">
                          <div className="text-gray-400">Unused</div>
                          <div className="text-orange-300 font-semibold">{amexUnusedCount}</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        {amexBenefits.slice(0, 4).map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between border border-border rounded-lg px-2 py-1.5">
                            <div>
                              <div className="text-white">{b.name}</div>
                              <div className="text-gray-400">{b.frequency} • {b.category}</div>
                            </div>
                            <div className="text-right">
                              <div className={b.status === 'unused' ? 'text-orange-300' : 'text-green-300'}>{b.status}</div>
                              <div className="text-gray-400">${Number(b.usedAmount || 0).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-[11px] text-gray-400">
                        Estimated cap tracked: ${amexEstimatedCap.toFixed(2)}
                      </div>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              </>
            )}
          </StaggerContainer>
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

// Task Panel
function TaskPanel({ tasks: taskList, onViewDetails }: any) {
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
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Tasks</h2>
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
