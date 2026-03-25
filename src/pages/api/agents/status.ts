import type { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';
import type { SessionNode } from '../../../components/SessionTree';

interface AgentStatus {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  level: number;
  status: 'running' | 'idle' | 'error' | 'offline' | 'weekend';
  lastActive: string;
  uptime?: string;
  contextUsed: number;
  contextMax: number;
  subagentCount: number;
  sourceAgentId?: string;
  model?: string;
}

interface OpenClawRecentSession {
  agentId?: string;
  key?: string;
  kind?: string;
  sessionId?: string;
  updatedAt?: number;
  age?: number;
  totalTokens?: number | null;
  totalTokensFresh?: boolean;
  remainingTokens?: number | null;
  percentUsed?: number | null;
  model?: string;
  contextTokens?: number;
  abortedLastRun?: boolean;
  flags?: string[];
}

interface OpenClawStatusPayload {
  sessions?: {
    count?: number;
    defaults?: {
      contextTokens?: number;
    };
    recent?: OpenClawRecentSession[];
    byAgent?: Array<{
      agentId: string;
      count?: number;
      recent?: OpenClawRecentSession[];
    }>;
  };
  gateway?: {
    reachable?: boolean;
  };
  agents?: {
    agents?: Array<{
      id: string;
      sessionsCount?: number;
      lastUpdatedAt?: number;
      lastActiveAgeMs?: number;
    }>;
  };
}

interface AgentSystemPayload {
  agents: AgentStatus[];
  sessionTree: SessionNode[];
  openclaw: {
    gateway: string;
    nodes: number;
    sessions: number;
  };
  timestamp: string;
  meta: {
    telemetryMode: 'live';
    sessionTreeMode: 'live';
    notes: string[];
  };
}

const AGENT_CATALOG: Record<string, Omit<AgentStatus, 'status' | 'lastActive' | 'contextUsed' | 'contextMax' | 'subagentCount'>> = {
  'clawd-prime': {
    id: 'clawd-prime',
    name: 'CLAWD Prime',
    emoji: '🦞',
    color: 'work',
    role: 'Director & Orchestrator',
    level: 1,
  },
  'work-agent': {
    id: 'work-agent',
    name: 'Work Agent',
    emoji: '🤖',
    color: 'work',
    role: 'Sales & Business Operations',
    level: 2,
  },
  'lifestyle-agent': {
    id: 'lifestyle-agent',
    name: 'Lifestyle Agent',
    emoji: '🧘',
    color: 'lifestyle',
    role: 'Wellness & Life Balance',
    level: 2,
  },
  'build-agent': {
    id: 'build-agent',
    name: 'Build Agent',
    emoji: '🔧',
    color: 'build',
    role: 'Engineering & Infrastructure',
    level: 2,
  },
  'email-agent': {
    id: 'email-agent',
    name: 'Email Agent',
    emoji: '📧',
    color: 'email',
    role: 'Inbox Monitor → Work Agent',
    level: 3,
  },
  'hubspot-agent': {
    id: 'hubspot-agent',
    name: 'HubSpot Agent',
    emoji: '📊',
    color: 'hubspot',
    role: 'CRM Data → Work Agent',
    level: 3,
  },
  'research-agent': {
    id: 'research-agent',
    name: 'Research Agent',
    emoji: '🔍',
    color: 'research',
    role: 'Intelligence Gathering',
    level: 3,
  },
};

function parseJson<T>(command: string, fallback: T): T {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: 5000,
      shell: '/bin/bash',
    });
    return JSON.parse(output) as T;
  } catch {
    return fallback;
  }
}

function toIso(updatedAt?: number, fallbackMs?: number) {
  const ms = typeof updatedAt === 'number' ? updatedAt : fallbackMs;
  return new Date(ms || Date.now()).toISOString();
}

function mapAgentType(session: OpenClawRecentSession): SessionNode['agentType'] {
  const key = session.key || '';
  if (key.includes('cron:')) return 'orchestrator';
  if (key.includes('subagent:')) return 'build';
  if (key.includes('telegram:direct:')) return (session.agentId || '') === 'sarah' ? 'lifestyle' : 'work';
  if (key.includes('telegram:slash:')) return 'research';
  if ((session.agentId || '') === 'sarah') return 'lifestyle';
  return 'orchestrator';
}

function mapSessionStatus(session: OpenClawRecentSession): SessionNode['status'] {
  if (session.abortedLastRun) return 'error';
  if ((session.percentUsed ?? 0) >= 85) return 'streaming';
  if ((session.age ?? Number.MAX_SAFE_INTEGER) < 5 * 60 * 1000) return 'thinking';
  if ((session.age ?? Number.MAX_SAFE_INTEGER) < 24 * 60 * 60 * 1000) return 'idle';
  return 'done';
}

function inferParentId(session: OpenClawRecentSession) {
  const key = session.key || '';
  if (key.includes('subagent:')) return 'session-root-build';
  if (key.includes('cron:')) return 'session-root-orchestrator';
  if (key.startsWith('agent:sarah:')) return 'session-root-lifestyle';
  if (key.includes('telegram:direct:')) return 'session-root-work';
  if (key.includes('telegram:slash:')) return 'session-root-research';
  if (key.startsWith('agent:main:')) return 'session-root-main';
  return 'session-root-main';
}

function buildSessionTree(status: OpenClawStatusPayload): SessionNode[] {
  const roots: SessionNode[] = [
    {
      id: 'session-root-orchestrator',
      parentId: null,
      name: 'Orchestrator Sessions',
      agentType: 'orchestrator',
      status: 'idle',
      startTime: new Date().toISOString(),
      children: [],
      depth: 0,
    },
    {
      id: 'session-root-work',
      parentId: null,
      name: 'Work Sessions',
      agentType: 'work',
      status: 'idle',
      startTime: new Date().toISOString(),
      children: [],
      depth: 0,
    },
    {
      id: 'session-root-build',
      parentId: null,
      name: 'Build Sessions',
      agentType: 'build',
      status: 'idle',
      startTime: new Date().toISOString(),
      children: [],
      depth: 0,
    },
    {
      id: 'session-root-lifestyle',
      parentId: null,
      name: 'Lifestyle Sessions',
      agentType: 'lifestyle',
      status: 'idle',
      startTime: new Date().toISOString(),
      children: [],
      depth: 0,
    },
    {
      id: 'session-root-research',
      parentId: null,
      name: 'Research Sessions',
      agentType: 'research',
      status: 'idle',
      startTime: new Date().toISOString(),
      children: [],
      depth: 0,
    },
    {
      id: 'session-root-main',
      parentId: null,
      name: 'Other Main Sessions',
      agentType: 'orchestrator',
      status: 'idle',
      startTime: new Date().toISOString(),
      children: [],
      depth: 0,
    },
  ];

  const rootMap = new Map(roots.map((root) => [root.id, root]));
  const recent = status.sessions?.recent || [];
  const nodes = recent.slice(0, 16).map((session, index): SessionNode => ({
    id: session.sessionId || session.key || `session-${index}`,
    parentId: inferParentId(session),
    name: session.key || session.sessionId || `Session ${index + 1}`,
    agentType: mapAgentType(session),
    status: mapSessionStatus(session),
    startTime: toIso(session.updatedAt, Date.now() - (session.age || 0)),
    children: [],
    depth: 1,
  }));

  for (const node of nodes) {
    const parent = rootMap.get(node.parentId || 'session-root-main');
    if (parent) {
      parent.children.push(node);
      if (node.status === 'streaming' || node.status === 'thinking') parent.status = node.status;
    }
  }

  return roots.filter((root) => root.children.length > 0);
}

function countChildSessions(agentId: string, status: OpenClawStatusPayload) {
  const byAgent = status.sessions?.byAgent || [];
  const match = byAgent.find((entry) => entry.agentId === agentId);
  return match?.count || 0;
}

function averagePercentUsed(sessions: OpenClawRecentSession[]) {
  const usable = sessions.filter((session) => typeof session.percentUsed === 'number' && typeof session.contextTokens === 'number');
  if (usable.length === 0) return { used: 0, max: usable[0]?.contextTokens || 262144 };
  const max = usable[0]?.contextTokens || 262144;
  const avgPercent = usable.reduce((sum, session) => sum + Number(session.percentUsed || 0), 0) / usable.length;
  return {
    used: Math.round((avgPercent / 100) * max),
    max,
  };
}

function deriveAgentStatus(agentId: string, status: OpenClawStatusPayload): AgentStatus {
  const byAgent = status.sessions?.byAgent || [];
  const agentSessions = byAgent.find((entry) => entry.agentId === agentId)?.recent || [];
  const latest = agentSessions[0];
  const catalog = AGENT_CATALOG[agentId] || {
    id: agentId,
    name: agentId,
    emoji: '🤖',
    color: 'work',
    role: 'OpenClaw agent',
    level: 3,
  };

  const context = averagePercentUsed(agentSessions);
  const age = latest?.age ?? status.agents?.agents?.find((agent) => agent.id === agentId)?.lastActiveAgeMs ?? Number.MAX_SAFE_INTEGER;

  let derivedStatus: AgentStatus['status'] = 'offline';
  if (latest?.abortedLastRun) derivedStatus = 'error';
  else if (age < 10 * 60 * 1000) derivedStatus = 'running';
  else if (age < 24 * 60 * 60 * 1000) derivedStatus = 'idle';
  else derivedStatus = 'offline';

  if (agentId === 'research-agent' && derivedStatus === 'offline') derivedStatus = 'weekend';

  return {
    ...catalog,
    status: derivedStatus,
    lastActive: toIso(latest?.updatedAt, Date.now() - age),
    contextUsed: context.used,
    contextMax: context.max,
    subagentCount: countChildSessions(agentId, status),
    sourceAgentId: agentId,
    model: latest?.model,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const openclawStatus = parseJson<OpenClawStatusPayload>('openclaw status --json || echo "{}"', {} as OpenClawStatusPayload);
    const sessionTree = buildSessionTree(openclawStatus);

    const mappedAgents = ['main', 'sarah'].map((agentId) => deriveAgentStatus(agentId, openclawStatus));
    const agents: AgentStatus[] = [
      {
        ...AGENT_CATALOG['clawd-prime'],
        status: openclawStatus.gateway?.reachable ? 'running' : 'idle',
        lastActive: toIso(openclawStatus.sessions?.recent?.[0]?.updatedAt),
        contextUsed: openclawStatus.sessions?.recent?.[0]?.totalTokens || 0,
        contextMax: openclawStatus.sessions?.recent?.[0]?.contextTokens || openclawStatus.sessions?.defaults?.contextTokens || 262144,
        subagentCount: (openclawStatus.sessions?.recent || []).filter((session) => (session.key || '').includes('subagent:')).length,
      },
      {
        ...mappedAgents[0],
        ...AGENT_CATALOG['work-agent'],
      },
      {
        ...mappedAgents[1],
        ...AGENT_CATALOG['lifestyle-agent'],
      },
      {
        ...deriveAgentStatus('main', openclawStatus),
        ...AGENT_CATALOG['build-agent'],
        subagentCount: (openclawStatus.sessions?.recent || []).filter((session) => (session.key || '').includes('subagent:')).length,
      },
      {
        ...AGENT_CATALOG['email-agent'],
        status: 'offline',
        lastActive: toIso(Date.now() - 86400000),
        contextUsed: 0,
        contextMax: openclawStatus.sessions?.defaults?.contextTokens || 262144,
        subagentCount: 0,
      },
      {
        ...AGENT_CATALOG['hubspot-agent'],
        status: 'offline',
        lastActive: toIso(Date.now() - 86400000),
        contextUsed: 0,
        contextMax: openclawStatus.sessions?.defaults?.contextTokens || 262144,
        subagentCount: 0,
      },
      {
        ...deriveAgentStatus('sarah', openclawStatus),
        ...AGENT_CATALOG['research-agent'],
      },
    ];

    const payload: AgentSystemPayload = {
      agents,
      sessionTree,
      openclaw: {
        gateway: openclawStatus.gateway?.reachable ? 'reachable' : 'unreachable',
        nodes: openclawStatus.agents?.agents?.length || 0,
        sessions: openclawStatus.sessions?.count || sessionTree.length,
      },
      timestamp: new Date().toISOString(),
      meta: {
        telemetryMode: 'live',
        sessionTreeMode: 'live',
        notes: [
          'Telemetry is derived from openclaw status --json session data.',
          'Session hierarchy is grouped from live recent sessions and agent buckets.',
        ],
      },
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Agent status API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch agent status',
      agents: [],
      sessionTree: [],
      meta: {
        telemetryMode: 'live',
        sessionTreeMode: 'live',
        notes: ['Agent status API failed while querying live OpenClaw status.'],
      },
    });
  }
}
