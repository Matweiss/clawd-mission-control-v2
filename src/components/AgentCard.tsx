import React from 'react';
import { RefreshCw, Activity } from 'lucide-react';

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  level: number;
  status: 'running' | 'idle' | 'error' | 'offline' | 'weekend';
  lastActive: string;
}

const colorMap: Record<string, { border: string; text: string; bg: string }> = {
  work: { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500' },
  build: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500' },
  research: { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-500' },
  lifestyle: { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-500' },
  email: { border: 'border-pink-500', text: 'text-pink-400', bg: 'bg-pink-500' },
  hubspot: { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500' },
};

const statusConfig: Record<string, { color: string; label: string; animate: boolean }> = {
  running: { color: 'bg-yellow-500', label: 'Active', animate: true },
  idle: { color: 'bg-green-500', label: 'Idle', animate: false },
  error: { color: 'bg-red-500', label: 'Error', animate: false },
  offline: { color: 'bg-gray-600', label: 'Offline', animate: false },
  weekend: { color: 'bg-purple-500', label: 'Weekend Off', animate: false },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface AgentCardProps {
  agent: AgentConfig;
  onRefresh?: () => void;
}

export function AgentCard({ agent, onRefresh }: AgentCardProps) {
  const colors = colorMap[agent.color] || colorMap.work;
  const status = statusConfig[agent.status] || statusConfig.offline;

  return (
    <div
      className={`bg-surface border ${
        agent.status === 'error' ? 'border-red-500' : agent.level === 1 ? 'border-red-500/50' : 'border-border'
      } rounded-xl p-4 hover:border-gray-600 transition-colors ${
        agent.level === 1 ? 'ring-1 ring-red-500/20' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl">{agent.emoji}</span>
            <span
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${
                status.color
              } ${status.animate ? 'animate-pulse' : ''}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${colors.text}`}>{agent.name}</h3>
              {agent.level === 1 && (
                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">YOU</span>
              )}
              {agent.level === 3 && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">L3</span>
              )}
            </div>
            <p className="text-xs text-gray-500">{agent.role}</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-surface-light rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Status</span>
          <span className={`font-medium ${status.color.replace('bg-', 'text-')}`}>{status.label}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Last Active</span>
          <span className="font-mono text-gray-400">{formatTimeAgo(agent.lastActive)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => alert(`Agent: ${agent.name}\nStatus: ${status.label}\nLast Active: ${formatTimeAgo(agent.lastActive)}\n\nFull logs available in OpenClaw session logs.`)}          className="flex-1 py-1.5 text-xs bg-surface-light hover:bg-border rounded transition-colors"
        >
          View Logs
        </button>
        <button
          onClick={() => alert(`Spawn task for ${agent.name}:\n\nThis would create a new task for this agent. Feature coming soon.`)}
          className="flex-1 py-1.5 text-xs bg-surface-light hover:bg-border rounded transition-colors"
        >
          Spawn Task
        </button>
      </div>
    </div>
  );
}
