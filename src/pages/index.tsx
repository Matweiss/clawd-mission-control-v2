import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Activity, Mail, Database, Cpu, Sparkles, 
  Zap, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, RefreshCw, MoreHorizontal,
  Command, Search, Settings, Bell, HardDrive
} from 'lucide-react';
import { useCommandPalette, useRealtimeData, useAgentActions } from '../hooks/useMissionControl';
import { CommandPalette } from '../components/CommandPalette';
import { LifestyleHealthPanel } from '../components/LifestyleHealthPanel';
import { PetTrackerPanel } from '../components/PetTrackerPanel';
import { QuickActionsPalette } from '../components/QuickActionsPalette';
import { AgentCommandCenter } from '../components/AgentCommandCenter';
import { SalesIntelligenceHub } from '../components/SalesIntelligenceHub';
import { DocumentRepository } from '../components/DocumentRepository';
import { PipelineDetailModal } from '../components/PipelineDetailModal';
import { EmailDetailModal } from '../components/EmailDetailModal';
import { CalendarPanel } from '../components/CalendarPanel';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { HomeAssistantCard } from '../components/HomeAssistantCard';
import { LucraCommissionCard } from '../components/LucraCommissionCard';
import { LifestyleGoalTrackerCard } from '../components/LifestyleGoalTrackerCard';
import { MovieTrackerCard } from '../components/MovieTrackerCard';

// Agent configuration - 3-Tier Architecture
const AGENTS = [
  // Level 1: Director (You)
  { id: 'clawd-prime', name: 'CLAWD Prime', emoji: '🦞', color: 'work', role: 'Director & Orchestrator', level: 1 },
  
  // Level 2: Directors
  { id: 'work-agent', name: 'Work Agent', emoji: '🤖', color: 'work', role: 'Sales & Business Operations', level: 2 },
  { id: 'lifestyle-agent', name: 'Lifestyle Agent', emoji: '🧘', color: 'lifestyle', role: 'Wellness & Life Balance', level: 2 },
  { id: 'build-agent', name: 'Build Agent', emoji: '🔧', color: 'build', role: 'Engineering & Infrastructure', level: 2 },
  
  // Level 3: Specialists
  { id: 'email-agent', name: 'Email Agent', emoji: '📧', color: 'email', role: 'Inbox Monitor → Work Agent', level: 3 },
  { id: 'hubspot-agent', name: 'HubSpot Agent', emoji: '📊', color: 'hubspot', role: 'CRM Data → Work Agent', level: 3 },
  { id: 'research-agent', name: 'Research Agent', emoji: '🔍', color: 'research', role: 'Intelligence Gathering', level: 3 },
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
  const { spawnAgent, refreshAgent } = useAgentActions();
  const { 
    agents, emails, pipeline, calendarEvents,
    loading, lastRefresh, refresh 
  } = useRealtimeData();
  const [activeAction, setActiveAction] = useState('');
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAgentCommandCenter, setShowAgentCommandCenter] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showSalesHub, setShowSalesHub] = useState(false);

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

  const [tasks, setTasks] = useState([
    { id: '1', title: 'Finalize HAP walkaway', priority: 'high' as const, status: 'pending' as const },
    { id: '2', title: 'Update Rodrigo contract', priority: 'high' as const, status: 'in_progress' as const },
    { id: '3', title: 'Update Chubby CPay pricing', priority: 'medium' as const, status: 'pending' as const },
    { id: '4', title: 'Create GFG rollout', priority: 'medium' as const, status: 'pending' as const },
    { id: '5', title: 'Wellness check', priority: 'low' as const, status: 'completed' as const },
    { id: '6', title: 'Research cache review', priority: 'low' as const, status: 'pending' as const },
  ]);

  const addTask = (task: any) => {
    setTasks([...tasks, { ...task, id: Date.now().toString() }]);
  };

  const updateTask = (id: string, updates: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
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
        agents={agents}
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
        onRefresh={(agentId) => console.log('Refresh', agentId)}
        onRestart={(agentId) => console.log('Restart', agentId)}
      />

      <SalesIntelligenceHub
        isOpen={showSalesHub}
        onClose={() => setShowSalesHub(false)}
        pipeline={pipeline}
        onRefresh={refresh}
      />

      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦞</span>
            <div>
              <h1 className="font-bold text-lg">Clawd Mission Control</h1>
              <p className="text-xs text-gray-400">AI Agent Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
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
              <span className="text-xs text-gray-500">⌘K</span>
            </button>
            
            <button 
              onClick={refresh}
              disabled={loading}
              className={`p-2 hover:bg-surface-light rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button className="p-2 hover:bg-surface-light rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              {urgentEmails.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* LEFT: Agent Swarm */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Agents</h2>
              <span className="text-xs text-gray-500">{agents.length}/7 Online</span>
            </div>
            
            <div className="space-y-3">
              {AGENTS.map(agent => {
                const agentData = agents.find((a: any) => a.agent_id === agent.id);
                return (
                  <AgentCard 
                    key={agent.id}
                    config={agent}
                    data={agentData}
                    onRefresh={() => refreshAgent(agent.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* CENTER: Operations */}
          <div className="space-y-4">
            <EmailPanel 
              urgent={urgentEmails}
              replyNeeded={replyNeededEmails}
              fyiCount={fyiEmails.length}
              totalCount={emails.length}
              onViewDetails={() => setShowEmailModal(true)}
              onRefresh={refresh}
              isLoading={loading}
            />

            <TaskPanel 
              tasks={tasks}
              onViewDetails={() => setShowTaskModal(true)}
            />

            <CronPanel />
          </div>

          {/* RIGHT: Intelligence */}
          <div className="space-y-4">
            <PipelinePanel 
              pipeline={pipeline}
              closingThisWeek={closingThisWeek}
              onViewDetails={() => setShowPipelineModal(true)}
            />

            <LucraCommissionCard />

            <ApiHealthPanel />

            <HomeAssistantCard />

            <LifestyleGoalTrackerCard />

            <MovieTrackerCard />

            <ActivityPanel activities={[]} />
            
            <PetTrackerPanel />

            <LifestyleHealthPanel />

            <CalendarPanel events={calendarEvents || []} />

            <DocumentRepository />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
        <div className="flex items-center justify-around px-2 py-2">
          <button 
            onClick={() => setShowQuickActions(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
          >
            <Zap className="w-5 h-5 text-work" />
            <span className="text-[10px] text-gray-400">Actions</span>
          </button>

          <button 
            onClick={() => setShowSalesHub(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
          >
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] text-gray-400">Pipeline</span>
          </button>

          <button 
            onClick={() => setShowEmailModal(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg relative"
          >
            <Mail className="w-5 h-5 text-pink-400" />
            <span className="text-[10px] text-gray-400">Emails</span>
            {emails.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-work text-[10px] rounded-full flex items-center justify-center">
                {emails.length}
              </span>
            )}
          </button>

          <button 
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Command className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] text-gray-400">Top</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Agent Card Component
function AgentCard({ config, data, onRefresh }: any) {
  const colors: any = {
    work: 'border-orange-500 text-orange-500',
    build: 'border-blue-500 text-blue-500',
    research: 'border-green-500 text-green-500',
    lifestyle: 'border-purple-500 text-purple-500',
    email: 'border-pink-500 text-pink-500',
    hubspot: 'border-cyan-500 text-cyan-500',
  };

  const status = data?.status || 'offline';
  const statusColor = status === 'running' ? 'bg-yellow-500 animate-pulse' :
                     status === 'error' ? 'bg-red-500' :
                     status === 'idle' ? 'bg-green-500' :
                     status === 'weekend' ? 'bg-purple-500' : 'bg-gray-600';

  return (
    <div className={`bg-surface border ${status === 'error' ? 'border-red-500' : config.level === 1 ? 'border-red-500/50' : 'border-border'} rounded-xl p-4 hover:border-gray-600 transition-colors ${config.level === 1 ? 'ring-1 ring-red-500/20' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl">{config.emoji}</span>
            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${statusColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${colors[config.color].split(' ')[1]}`}>{config.name}</h3>
              {config.level === 1 && (
                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">YOU</span>
              )}
              {config.level === 3 && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">L3</span>
              )}
            </div>
            <p className="text-xs text-gray-500">{config.role}</p>
          </div>
        </div>
        <button 
          onClick={onRefresh}
          className="p-1 hover:bg-surface-light rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-mono">{data.success_rate || 0}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full bg-${config.color === 'work' ? 'orange' : config.color === 'build' ? 'blue' : config.color === 'research' ? 'green' : config.color === 'lifestyle' ? 'purple' : config.color === 'email' ? 'pink' : 'cyan'}-500`}
              style={{ width: `${data.success_rate || 0}%` }}
            />
          </div>
          {data.last_task && (
            <p className="text-xs text-gray-500 truncate">{data.last_task}</p>
          )}
        </div>
      )}

      {!data && (
        <p className="text-xs text-gray-600">No data available</p>
      )}

      <div className="flex gap-2 mt-3">
        <button 
          onClick={() => alert(`Logs for ${config.name}:\n\nLast run: ${data?.updated_at || 'Never'}\nStatus: ${status}\nSuccess rate: ${data?.success_rate || 0}%`)}
          className="flex-1 py-1.5 text-xs bg-surface-light hover:bg-border rounded transition-colors"
        >
          View Logs
        </button>
        <button 
          onClick={() => alert(`Spawn task for ${config.name}:\n\nFeature coming soon: Create custom tasks for this agent`)}
          className="flex-1 py-1.5 text-xs bg-surface-light hover:bg-border rounded transition-colors"
        >
          Spawn Task
        </button>
      </div>
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
