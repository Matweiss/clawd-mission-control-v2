import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, Clock, AlertCircle, Zap, 
  MessageSquare, FileText, RefreshCw, Filter, Radio,
  Cpu, Database, Globe, ChevronDown, ChevronUp
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  status: 'success' | 'pending' | 'error';
  duration?: string;
  details?: string;
}

interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  status: 'active' | 'idle' | 'error';
  lastAction: string;
  uptime: string;
  tasksCompleted: number;
  currentTask?: string;
  cpuUsage: number;
  memoryUsage: number;
}

const AGENTS: AgentStatus[] = [
  {
    id: 'clawd-prime',
    name: 'CLAWD Prime',
    emoji: '🦞',
    status: 'active',
    lastAction: 'Orchestrating agent swarm',
    uptime: '48h 23m',
    tasksCompleted: 127,
    currentTask: 'Reviewing battle cards',
    cpuUsage: 45,
    memoryUsage: 62
  },
  {
    id: 'work-agent',
    name: 'Work Agent',
    emoji: '🤖',
    status: 'active',
    lastAction: 'Pipeline cache refresh',
    uptime: '48h 23m',
    tasksCompleted: 342,
    currentTask: 'Generating battle cards',
    cpuUsage: 78,
    memoryUsage: 45
  },
  {
    id: 'email-agent',
    name: 'Email Agent',
    emoji: '📧',
    status: 'active',
    lastAction: 'Inbox scan complete',
    uptime: '48h 23m',
    tasksCompleted: 1205,
    currentTask: 'Scanning for urgent emails',
    cpuUsage: 23,
    memoryUsage: 34
  },
  {
    id: 'build-agent',
    name: 'Build Agent',
    emoji: '🔧',
    status: 'active',
    lastAction: 'Dashboard deployment',
    uptime: '48h 23m',
    tasksCompleted: 89,
    currentTask: 'Building Agent Souls view',
    cpuUsage: 65,
    memoryUsage: 78
  },
  {
    id: 'lifestyle-agent',
    name: 'Lifestyle Agent',
    emoji: '🧘',
    status: 'idle',
    lastAction: 'Morning check-in sent',
    uptime: '48h 23m',
    tasksCompleted: 56,
    cpuUsage: 12,
    memoryUsage: 28
  },
  {
    id: 'hubspot-agent',
    name: 'HubSpot Agent',
    emoji: '📊',
    status: 'error',
    lastAction: 'Token refresh failed',
    uptime: '48h 23m',
    tasksCompleted: 234,
    cpuUsage: 0,
    memoryUsage: 15
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    emoji: '🔍',
    status: 'active',
    lastAction: 'Company research complete',
    uptime: '48h 23m',
    tasksCompleted: 67,
    currentTask: 'Researching NexGen Robotics',
    cpuUsage: 34,
    memoryUsage: 41
  },
];

const ACTIVITY_LOGS: ActivityLog[] = [
  { id: '1', timestamp: '2 min ago', agent: 'Build Agent', action: 'Deployed dashboard update', status: 'success', duration: '45s' },
  { id: '2', timestamp: '3 min ago', agent: 'Work Agent', action: 'Generated battle card', status: 'success', duration: '12s', details: 'Dragon Technologies' },
  { id: '3', timestamp: '5 min ago', agent: 'Email Agent', action: 'Processed inbox', status: 'success', duration: '8s', details: '12 emails scanned' },
  { id: '4', timestamp: '5 min ago', agent: 'HubSpot Agent', action: 'Token refresh', status: 'error', details: '401 Unauthorized' },
  { id: '5', timestamp: '8 min ago', agent: 'CLAWD Prime', action: 'Orchestrated handoff', status: 'success', duration: '3s', details: 'Work Agent → Mat' },
  { id: '6', timestamp: '10 min ago', agent: 'Research Agent', action: 'Completed research', status: 'success', duration: '2m 34s', details: 'Nebula Robotics' },
  { id: '7', timestamp: '12 min ago', agent: 'Lifestyle Agent', action: 'Sent check-in', status: 'success', duration: '1s' },
  { id: '8', timestamp: '15 min ago', agent: 'Build Agent', action: 'Fixed TypeScript error', status: 'success', duration: '5m 12s' },
];

const STATUS_COLORS: any = {
  active: 'text-green-400 bg-green-500/10 border-green-500/30',
  idle: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  error: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const STATUS_ICONS: any = {
  active: Radio,
  idle: Clock,
  error: AlertCircle,
};

export function AgentMonitorView() {
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'error'>('all');
  const [logs, setLogs] = useState<ActivityLog[]>(ACTIVITY_LOGS);
  const [isLive, setIsLive] = useState(true);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      // In real implementation, this would fetch from API
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredAgents = filter === 'all' 
    ? AGENTS 
    : AGENTS.filter(a => filter === 'error' ? a.status === 'error' : a.status !== 'error');

  const activeCount = AGENTS.filter(a => a.status === 'active').length;
  const errorCount = AGENTS.filter(a => a.status === 'error').length;
  const totalTasks = AGENTS.reduce((sum, a) => sum + a.tasksCompleted, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time activity and system health</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isLive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="Active Agents" 
          value={activeCount} 
          total={7} 
          color="green"
          icon={Activity}
        />
        <StatCard 
          label="System Errors" 
          value={errorCount} 
          total={7} 
          color={errorCount > 0 ? 'red' : 'green'}
          icon={AlertCircle}
        />
        <StatCard 
          label="Tasks Completed" 
          value={totalTasks} 
          color="blue"
          icon={CheckCircle2}
        />
        <StatCard 
          label="Uptime" 
          value="48h" 
          color="purple"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Agent Status Grid */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Agent Status</h2>
            
            <div className="flex items-center gap-1">
              {['all', 'active', 'error'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                    filter === f 
                      ? 'bg-[#2A2A2A] text-white' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredAgents.map((agent) => {
              const StatusIcon = STATUS_ICONS[agent.status];
              return (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="bg-[#161616] rounded-xl p-4 cursor-pointer hover:bg-[#1A1A1A] transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center text-xl">
                        {agent.emoji}
                      </div>
                      
                      <div>
                        <p className="font-medium text-white">{agent.name}</p>
                        <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full w-fit ${STATUS_COLORS[agent.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="capitalize">{agent.status}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronDown className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {agent.currentTask && (
                    <div className="mb-3 p-2 bg-[#0F0F0F] rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Current Task</p>
                      <p className="text-sm text-gray-300 truncate">{agent.currentTask}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-[#0F0F0F] rounded">
                      <p className="text-gray-500">CPU</p>
                      <p className={`font-medium ${agent.cpuUsage > 70 ? 'text-red-400' : 'text-white'}`}>
                        {agent.cpuUsage}%
                      </p>
                    </div>
                    
                    <div className="text-center p-2 bg-[#0F0F0F] rounded">
                      <p className="text-gray-500">Memory</p>
                      <p className={`font-medium ${agent.memoryUsage > 70 ? 'text-yellow-400' : 'text-white'}`}>
                        {agent.memoryUsage}%
                      </p>
                    </div>
                    
                    <div className="text-center p-2 bg-[#0F0F0F] rounded">
                      <p className="text-gray-500">Tasks</p>
                      <p className="text-white font-medium">{agent.tasksCompleted}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-[#161616] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
            <h2 className="text-sm font-semibold text-white">Activity Log</h2>
            
            <button className="p-1.5 hover:bg-[#2A2A2A] rounded">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border-b border-[#2A2A2A] last:border-0 hover:bg-[#1A1A1A]">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full ${
                    log.status === 'success' ? 'bg-green-500' : 
                    log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{log.action}</p>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-0.5">{log.agent}</p>
                    
                    {log.details && (
                      <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                    )}
                    
                    {log.duration && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{log.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal 
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, total, color, icon: Icon }: any) {
  const colorClasses: any = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-[#161616] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</span>
        {total && <span className="text-sm text-gray-500">/ {total}</span>}
      </div>
    </div>
  );
}

function AgentDetailModal({ agent, onClose }: { agent: AgentStatus; onClose: () => void }) {
  const StatusIcon = STATUS_ICONS[agent.status];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-3xl">
              {agent.emoji}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full w-fit ${STATUS_COLORS[agent.status]}`}>
                <StatusIcon className="w-3 h-3" />
                <span className="capitalize">{agent.status}</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-[#2A2A2A] rounded-lg">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Uptime" value={agent.uptime} icon={Clock} />
            <MetricCard label="Tasks Completed" value={agent.tasksCompleted.toString()} icon={CheckCircle2} />
          </div>

          <div className="bg-[#0F0F0F] rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-3">Resource Usage</h3>
            
            <div className="space-y-3">
              <ResourceBar label="CPU" value={agent.cpuUsage} color={agent.cpuUsage > 70 ? 'red' : 'green'} />
              <ResourceBar label="Memory" value={agent.memoryUsage} color={agent.memoryUsage > 70 ? 'yellow' : 'blue'} />
            </div>
          </div>

          <div className="bg-[#0F0F0F] rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-2">Last Action</h3>
            <p className="text-white">{agent.lastAction}</p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-sm text-white transition-colors">
              View Logs
            </button>
            <button className="flex-1 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm transition-colors">
              Restart Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-[#0F0F0F] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ResourceBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: any = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className={`font-medium ${value > 70 ? 'text-red-400' : 'text-white'}`}>{value}%</span>
      </div>
      <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorMap[color]} rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
