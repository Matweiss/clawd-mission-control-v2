import React from 'react';
import { RefreshCw } from 'lucide-react';
import { ContextPressureMeter } from './ContextPressureMeter';

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  level: number;
  status: 'running' | 'idle' | 'error' | 'offline' | 'weekend';
  lastActive: string;
  contextUsed?: number;
  contextMax?: number;
  subagentCount?: number;
}

// Map agent.color → CSS var for the 2px department accent strip.
const DEPT_ACCENT: Record<string, string> = {
  work: 'var(--dept-sales)',
  build: 'var(--dept-build)',
  research: 'var(--dept-research)',
  lifestyle: 'var(--dept-life)',
  email: 'var(--dept-email)',
  hubspot: 'var(--dept-browser)',
  arty: 'var(--dept-creative)',
  vandalay: 'var(--dept-strategy)',
  sloan: 'var(--dept-ops)',
};

const STATUS_CHIP: Record<string, { color: string; bg: string; label: string; pulse: boolean }> = {
  running: { color: 'var(--status-active)', bg: 'var(--status-active-bg)', label: 'Active', pulse: true },
  idle:    { color: 'var(--status-idle)',   bg: 'var(--status-idle-bg)',   label: 'Idle',   pulse: false },
  error:   { color: 'var(--status-error)',  bg: 'var(--status-error-bg)',  label: 'Error',  pulse: false },
  offline: { color: 'var(--text-2)',        bg: 'var(--status-off-bg)',    label: 'Offline', pulse: false },
  weekend: { color: 'var(--dept-ops)',      bg: 'rgba(140, 125, 217, 0.10)', label: 'Weekend Off', pulse: false },
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
  onOpenDetails?: (agent: AgentConfig) => void;
  telemetryMode?: 'live' | 'simulated';
}

export function AgentCard({ agent, onRefresh, onOpenDetails, telemetryMode = 'live' }: AgentCardProps) {
  const accent = agent.level === 1 ? 'var(--dept-ceo)' : (DEPT_ACCENT[agent.color] || 'var(--dept-build)');
  const status = STATUS_CHIP[agent.status] || STATUS_CHIP.offline;
  const contextUsed = agent.contextUsed ?? 0;
  const contextMax = agent.contextMax ?? 128000;
  const subagentCount = agent.subagentCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onOpenDetails?.(agent)}
      className="group relative w-full text-left bg-white/[0.045] hover:bg-white/[0.065] border border-white/10 hover:border-white/20 rounded-2xl pl-5 pr-4 py-3.5 transition-all shadow-lg shadow-black/10"
    >
      {/* 2px department accent strip — replaces ring/glow system */}
      <span
        aria-hidden
        className="absolute left-0 top-3.5 bottom-3.5 w-[2px] rounded-r"
        style={{ background: accent, opacity: 0.85 }}
      />

      {/* Header: avatar + identity + refresh */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 grid place-items-center text-base flex-shrink-0">
          {agent.emoji}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-white truncate">{agent.name}</h3>
            {agent.level === 1 && (
              <span
                className="text-[9px] font-bold tracking-wider px-1 py-px rounded border"
                style={{ color: accent, borderColor: accent, opacity: 0.7 }}
              >
                CEO
              </span>
            )}
            {agent.level === 3 && (
              <span className="text-[9px] font-bold tracking-wider px-1 py-px rounded border border-white/15 text-gray-400">
                L3
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 truncate mt-px">{agent.role}</p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className="w-6 h-6 grid place-items-center rounded text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
            title="Refresh agent status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {telemetryMode === 'simulated' && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1.5 text-[10px] text-blue-200 mb-2.5">
          Simulated telemetry — context + session load
        </div>
      )}

      {/* Status chip + last seen */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="inline-flex items-center gap-1.5 h-5 px-2 rounded text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: status.color, background: status.bg }}
        >
          {status.pulse && (
            <span
              className="w-1 h-1 rounded-full animate-pulse"
              style={{ background: status.color }}
            />
          )}
          {status.label}
        </span>
        <span className="ml-auto text-[11px] font-mono text-gray-500 tabular-nums">
          {formatTimeAgo(agent.lastActive)}
        </span>
      </div>

      {/* Context pressure meter */}
      <div className="mb-2.5">
        <ContextPressureMeter used={contextUsed} max={contextMax} size="sm" />
      </div>

      {/* Footer stats — replaces the old "Open Details / Spawn Soon" button row */}
      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2.5 mt-1">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Subagents</div>
          <div className="font-mono text-xs text-gray-200 tabular-nums mt-0.5">{subagentCount}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Last seen</div>
          <div className="font-mono text-xs text-gray-200 tabular-nums mt-0.5">
            {formatTimeAgo(agent.lastActive)}
          </div>
        </div>
      </div>
    </button>
  );
}
