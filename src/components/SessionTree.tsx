import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Circle, CheckCircle2, Loader2, XCircle, Zap, Cpu } from 'lucide-react';

export interface SessionNode {
  id: string;
  parentId: string | null;
  name: string;
  agentType: 'work' | 'build' | 'research' | 'lifestyle' | 'orchestrator' | 'email' | 'hubspot';
  status: 'idle' | 'thinking' | 'streaming' | 'done' | 'error';
  startTime: string;
  children: SessionNode[];
  depth: number;
}

interface SessionTreeProps {
  sessions: SessionNode[];
}

const agentColors: Record<string, string> = {
  work: 'text-orange-400',
  build: 'text-blue-400',
  research: 'text-green-400',
  lifestyle: 'text-purple-400',
  orchestrator: 'text-pink-400',
  email: 'text-pink-400',
  hubspot: 'text-cyan-400',
};

function formatStarted(startTime: string) {
  const then = new Date(startTime).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusIcon({ status }: { status: SessionNode['status'] }) {
  switch (status) {
    case 'thinking':
      return <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />;
    case 'streaming':
      return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
    case 'done':
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    default:
      return <Circle className="w-3.5 h-3.5 text-gray-500 fill-current" />;
  }
}

function TreeRow({ node, expanded, toggle }: { node: SessionNode; expanded: Set<string>; toggle: (id: string) => void }) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  return (
    <div>
      <button
        type="button"
        onClick={() => hasChildren && toggle(node.id)}
        className="w-full rounded-lg border border-gray-700/40 bg-surface-light/70 px-3 py-2 text-left hover:border-gray-600 transition-colors"
        style={{ marginLeft: `${node.depth * 20}px`, width: `calc(100% - ${node.depth * 20}px)` }}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5 w-4 flex-shrink-0">
            {hasChildren ? (
              isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : null}
          </div>
          <StatusIcon status={node.status} />
          <Cpu className={`w-4 h-4 mt-0.5 ${agentColors[node.agentType] || 'text-gray-400'}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white truncate">{node.name}</span>
              <span className="text-[10px] uppercase tracking-wide text-gray-500">{node.status}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-400">
              <span className="capitalize">{node.agentType}</span>
              <span>{formatStarted(node.startTime)}</span>
            </div>
          </div>
        </div>
      </button>

      {hasChildren && isOpen && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} expanded={expanded} toggle={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SessionTree({ sessions }: SessionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(sessions.map((s) => s.id)));

  const roots = useMemo(() => sessions.filter((session) => session.parentId === null), [sessions]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Session Tree</h3>
          <p className="text-[11px] text-gray-400">Live hierarchy of active and recent agent sessions</p>
        </div>
        <span className="text-xs text-gray-500">{sessions.length} nodes</span>
      </div>

      <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
        {roots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
            No session tree data yet.
          </div>
        ) : (
          roots.map((node) => (
            <TreeRow key={node.id} node={node} expanded={expanded} toggle={toggle} />
          ))
        )}
      </div>
    </div>
  );
}

export default SessionTree;
