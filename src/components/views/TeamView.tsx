import React, { useState } from 'react';
import { 
  Activity, MessageSquare, Mail, CheckCircle2, Clock, 
  AlertCircle, Briefcase, Heart, Code, Search, BarChart3,
  Zap, MoreHorizontal, Filter
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  status: 'online' | 'idle' | 'running' | 'offline';
  lastActive: string;
  color: string;
  tasks: number;
  description: string;
  currentTask?: string;
  recentActivity: ActivityItem[];
  assignedProjects: string[];
}

interface ActivityItem {
  id: string;
  type: 'task_completed' | 'message_sent' | 'sync_done' | 'alert_triggered' | 'meeting_prep';
  description: string;
  timestamp: string;
  project?: string;
}

const AGENTS: Agent[] = [
  {
    id: 'clawd-prime',
    name: 'CLAWD Prime',
    role: 'Director & Orchestrator',
    emoji: '🦞',
    status: 'online',
    lastActive: 'Now',
    color: 'from-red-500 to-orange-500',
    tasks: 12,
    description: 'Strategic oversight, final decisions',
    currentTask: 'Reviewing agent performance',
    assignedProjects: ['Mission Control', 'Agent Swarm'],
    recentActivity: [
      { id: '1', type: 'task_completed', description: 'Approved Lifestyle Agent v2 spec', timestamp: '5 min ago', project: 'Lifestyle' },
      { id: '2', type: 'meeting_prep', description: 'Generated battle card for Dragon Tech', timestamp: '1 hour ago', project: 'Sales' },
      { id: '3', type: 'alert_triggered', description: 'Flagged HubSpot token expiry', timestamp: '2 hours ago', project: 'Infrastructure' },
    ]
  },
  {
    id: 'work-agent',
    name: 'Work Agent',
    role: 'Sales & Business Operations',
    emoji: '🤖',
    status: 'running',
    lastActive: 'Active',
    color: 'from-orange-500 to-yellow-500',
    tasks: 8,
    description: 'Pipeline management, battle cards',
    currentTask: 'Monitoring pipeline for stale deals',
    assignedProjects: ['Q1 Sales', 'Mission Control'],
    recentActivity: [
      { id: '4', type: 'sync_done', description: 'Refreshed HubSpot pipeline cache', timestamp: '30 min ago', project: 'Sales' },
      { id: '5', type: 'meeting_prep', description: 'Created 3 battle cards for today', timestamp: '1 hour ago', project: 'Sales' },
      { id: '6', type: 'alert_triggered', description: 'Detected stale deal: Vertex Systems', timestamp: '3 hours ago', project: 'Sales' },
    ]
  },
  {
    id: 'lifestyle-agent',
    name: 'Lifestyle Agent',
    role: 'Wellness & Life Balance',
    emoji: '🧘',
    status: 'idle',
    lastActive: '15 min ago',
    color: 'from-purple-500 to-pink-500',
    tasks: 3,
    description: 'Health tracking, check-ins',
    currentTask: 'Waiting for evening check-in window',
    assignedProjects: ['Lifestyle Integration'],
    recentActivity: [
      { id: '7', type: 'message_sent', description: 'Sent morning check-in to Mat', timestamp: '8 hours ago', project: 'Lifestyle' },
      { id: '8', type: 'alert_triggered', description: 'Sleep quality below threshold', timestamp: '1 day ago', project: 'Lifestyle' },
    ]
  },
  {
    id: 'build-agent',
    name: 'Build Agent',
    role: 'Engineering & Infrastructure',
    emoji: '🔧',
    status: 'running',
    lastActive: 'Active',
    color: 'from-blue-500 to-cyan-500',
    tasks: 15,
    description: 'APIs, integrations, devops',
    currentTask: 'Deploying dashboard updates',
    assignedProjects: ['Mission Control', 'Tesla API', 'Infrastructure'],
    recentActivity: [
      { id: '9', type: 'task_completed', description: 'Fixed CalendarView JSX errors', timestamp: 'Just now', project: 'Mission Control' },
      { id: '10', type: 'sync_done', description: 'Deployed v2.3 to Vercel', timestamp: '30 min ago', project: 'Mission Control' },
      { id: '11', type: 'task_completed', description: 'Updated OAuth token handler', timestamp: '2 hours ago', project: 'Infrastructure' },
    ]
  },
  {
    id: 'email-agent',
    name: 'Email Agent',
    role: 'Inbox Monitor',
    emoji: '📧',
    status: 'running',
    lastActive: 'Active',
    color: 'from-pink-500 to-rose-500',
    tasks: 24,
    description: 'Email triage every 5 min',
    currentTask: 'Scanning inbox for urgent emails',
    assignedProjects: ['Communications'],
    recentActivity: [
      { id: '12', type: 'sync_done', description: 'Processed 12 new emails', timestamp: '5 min ago' },
      { id: '13', type: 'alert_triggered', description: 'Flagged urgent email from legal@', timestamp: '1 hour ago' },
      { id: '14', type: 'task_completed', description: 'Auto-categorized 45 emails', timestamp: '2 hours ago' },
    ]
  },
  {
    id: 'hubspot-agent',
    name: 'HubSpot Agent',
    role: 'CRM Data',
    emoji: '📊',
    status: 'running',
    lastActive: 'Active',
    color: 'from-cyan-500 to-teal-500',
    tasks: 5,
    description: 'Pipeline cache every 30 min',
    currentTask: 'Refreshing deal data',
    assignedProjects: ['Sales', 'Data'],
    recentActivity: [
      { id: '15', type: 'sync_done', description: 'Updated pipeline cache', timestamp: '15 min ago', project: 'Sales' },
      { id: '16', type: 'alert_triggered', description: 'Token refresh failed - needs attention', timestamp: '1 hour ago', project: 'Infrastructure' },
    ]
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    role: 'Intelligence Gathering',
    emoji: '🔍',
    status: 'idle',
    lastActive: '2 hours ago',
    color: 'from-green-500 to-emerald-500',
    tasks: 2,
    description: 'Company research, battle prep',
    currentTask: 'Researching Nebula Robotics',
    assignedProjects: ['Research', 'Sales'],
    recentActivity: [
      { id: '17', type: 'task_completed', description: 'Completed company research: Aether AI', timestamp: '2 hours ago', project: 'Research' },
      { id: '18', type: 'task_completed', description: 'Updated 3 battle cards', timestamp: '4 hours ago', project: 'Sales' },
    ]
  },
];

const STATUS_COLORS: any = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  running: 'bg-blue-500 animate-pulse',
  offline: 'bg-gray-500',
};

const ACTIVITY_ICONS: any = {
  task_completed: CheckCircle2,
  message_sent: MessageSquare,
  sync_done: Zap,
  alert_triggered: AlertCircle,
  meeting_prep: Briefcase,
};

const ACTIVITY_COLORS: any = {
  task_completed: 'text-green-400',
  message_sent: 'text-blue-400',
  sync_done: 'text-purple-400',
  alert_triggered: 'text-red-400',
  meeting_prep: 'text-orange-400',
};

export function TeamView() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle'>('all');

  const filteredAgents = filter === 'all' 
    ? AGENTS 
    : AGENTS.filter(a => filter === 'active' ? a.status === 'running' : a.status === 'idle');

  if (selectedAgent) {
    return (
      <AgentDetailView 
        agent={selectedAgent} 
        onBack={() => setSelectedAgent(null)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Your AI agent swarm - 7 agents across 3 tiers</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-white"
          >
            <option value="all">All Agents</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredAgents.map((agent) => (
          <AgentCard 
            key={agent.id}
            agent={agent}
            onClick={() => setSelectedAgent(agent)}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#161616] rounded-xl p-4 hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl`}>
            {agent.emoji}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#161616] ${STATUS_COLORS[agent.status]}`}/>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-xs text-gray-400">{agent.role}</p>
            </div>
            
            <span className="text-xs text-gray-500">{agent.lastActive}</span>
          </div>

          {agent.currentTask && (
            <div className="mt-2 p-2 bg-[#0F0F0F] rounded-lg">
              <p className="text-xs text-gray-500 mb-0.5">Current Activity</p>
              <p className="text-sm text-gray-300 truncate">{agent.currentTask}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Activity className="w-3.5 h-3.5" />
              <span>{agent.tasks} tasks</span>
            </div>

            <div className="flex gap-1">
              {agent.assignedProjects.slice(0, 2).map((project, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 bg-[#2A2A2A] rounded text-gray-400">
                  {project}
                </span>
              ))}
              {agent.assignedProjects.length > 2 && (
                <span className="text-[10px] px-2 py-0.5 bg-[#2A2A2A] rounded text-gray-400">
                  +{agent.assignedProjects.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDetailView({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'activity' | 'projects' | 'info'>('activity');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors"
        >
          <span className="text-gray-400">←</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-3xl`}>
            {agent.emoji}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[agent.status]}`}/>
            </div>
            <p className="text-sm text-gray-400">{agent.role}</p>
          </div>
        </div>
      </div>

      {/* Current Task Banner */}
      {agent.currentTask && (
        <div className="bg-[#161616] rounded-xl p-4 mb-6 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-400">Currently Working On</span>
          </div>
          <p className="text-white font-medium">{agent.currentTask}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#2A2A2A]">
        {['activity', 'projects', 'info'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm capitalize transition-colors ${
              activeTab === tab 
                ? 'text-white border-b-2 border-orange-500' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {agent.recentActivity.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#161616] rounded-lg">
                <div className={`mt-0.5 ${ACTIVITY_COLORS[activity.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    {activity.project && (
                      <>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-orange-400">{activity.project}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-2 gap-3">
          {agent.assignedProjects.map((project, i) => (
            <div key={i} className="p-4 bg-[#161616] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-orange-400" />
                <span className="text-white font-medium">{project}</span>
              </div>
              <p className="text-xs text-gray-500">Active contributor</p>
            </div>
          ))}
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
            <p className="text-white">{agent.description}</p>
          </div>
          
          <div className="bg-[#161616] rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{agent.tasks}</p>
                <p className="text-xs text-gray-500">Active Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{agent.assignedProjects.length}</p>
                <p className="text-xs text-gray-500">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{agent.recentActivity.length}</p>
                <p className="text-xs text-gray-500">Recent Activities</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
