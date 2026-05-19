import type { NextApiRequest, NextApiResponse } from 'next';
import type { SessionNode } from '../../../components/SessionTree';
import { runOpenClawJson } from '../../../lib/openclaw-cli';

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
  successRate: number | null;
  recentSessionCount: number;
  lastTask?: string | null;
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

const AGENT_CATALOG: Record<string, Omit<AgentStatus, 'status' | 'lastActive' | 'contextUsed' | 'contextMax' | 'subagentCount' | 'successRate' | 'recentSessionCount' | 'lastTask'>> = {
  'a0edadcb-f994-40e3-a9a1-d3ffde595c3e': {
    id: 'a0edadcb-f994-40e3-a9a1-d3ffde595c3e',
    name: 'Clawd',
    emoji: '🦞',
    color: 'work',
    role: 'CEO & Orchestrator',
    level: 1,
  },
  '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8': {
    id: '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8',
    name: 'Vandalay',
    emoji: '📈',
    color: 'vandalay',
    role: 'Chief Strategy Officer',
    level: 2,
  },
  '1ef5e05b-7a16-4ebc-8c05-cdb03a321197': {
    id: '1ef5e05b-7a16-4ebc-8c05-cdb03a321197',
    name: 'Sloan',
    emoji: '📋',
    color: 'sloan',
    role: 'Chief of Staff',
    level: 2,
  },
  'fd4efc78-5969-47f3-878a-457654682548': {
    id: 'fd4efc78-5969-47f3-878a-457654682548',
    name: 'Bob',
    emoji: '🔧',
    color: 'build',
    role: 'Head of Build',
    level: 2,
  },
  '8c40bdd4-7e82-40a7-9fa7-982b0931d705': {
    id: '8c40bdd4-7e82-40a7-9fa7-982b0931d705',
    name: 'Luke',
    emoji: '💼',
    color: 'work',
    role: 'Sales & Lucra Ops',
    level: 2,
  },
  'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6': {
    id: 'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6',
    name: 'Sage',
    emoji: '🌿',
    color: 'lifestyle',
    role: 'Personal & Lifestyle',
    level: 2,
  },
  'e6822182-3611-4152-a1f2-aab9975fce3d': {
    id: 'e6822182-3611-4152-a1f2-aab9975fce3d',
    name: 'Hermes',
    emoji: '✉️',
    color: 'email',
    role: 'Google Workspace Ops',
    level: 3,
  },
  'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f': {
    id: 'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f',
    name: 'Scout',
    emoji: '🔍',
    color: 'research',
    role: 'Research & Intelligence',
    level: 3,
  },
  '951c871e-fcb0-4211-bf92-19b0812d16bd': {
    id: '951c871e-fcb0-4211-bf92-19b0812d16bd',
    name: 'Pixel',
    emoji: '🌐',
    color: 'hubspot',
    role: 'Browser & Scheduling',
    level: 3,
  },
  '61ee0d8e-ac57-47bc-8402-5d3a756427ad': {
    id: '61ee0d8e-ac57-47bc-8402-5d3a756427ad',
    name: 'Arty',
    emoji: '🎨',
    color: 'arty',
    role: 'Art & Shopify Ops',
    level: 3,
  },
};


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
  if (usable.length === 0) return { used: 0, max: 262144 };
  const max = usable[0]?.contextTokens || 262144;
  const avgPercent = usable.reduce((sum, session) => sum + Number(session.percentUsed || 0), 0) / usable.length;
  return {
    used: Math.round((avgPercent / 100) * max),
    max,
  };
}

function deriveSuccessRate(sessions: OpenClawRecentSession[]): number | null {
  // Use the last 20 sessions and report the percentage that did not abort.
  // Null when there's nothing to score, so the UI can render "live / unavailable".
  const sample = sessions.slice(0, 20);
  if (sample.length === 0) return null;
  const successes = sample.filter((s) => !s.abortedLastRun).length;
  return Math.round((successes / sample.length) * 100);
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
    successRate: deriveSuccessRate(agentSessions),
    recentSessionCount: agentSessions.length,
    lastTask: latest?.key || null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const openclawStatus = runOpenClawJson<OpenClawStatusPayload>(['status'], {} as OpenClawStatusPayload);
    const sessionTree = buildSessionTree(openclawStatus);

    const agentMappings = [
      { catalogId: 'a0edadcb-f994-40e3-a9a1-d3ffde595c3e', openclawAgentId: 'main' },
      { catalogId: '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8', openclawAgentId: 'vandalay' },
      { catalogId: '1ef5e05b-7a16-4ebc-8c05-cdb03a321197', openclawAgentId: 'sloan' },
      { catalogId: 'fd4efc78-5969-47f3-878a-457654682548', openclawAgentId: 'builder' },
      { catalogId: '8c40bdd4-7e82-40a7-9fa7-982b0931d705', openclawAgentId: 'lucra' },
      { catalogId: 'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6', openclawAgentId: 'lifestyle' },
      { catalogId: 'e6822182-3611-4152-a1f2-aab9975fce3d', openclawAgentId: 'hermes' },
      { catalogId: 'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f', openclawAgentId: 'scout' },
      { catalogId: '951c871e-fcb0-4211-bf92-19b0812d16bd', openclawAgentId: 'pixel' },
      { catalogId: '61ee0d8e-ac57-47bc-8402-5d3a756427ad', openclawAgentId: 'sarah' },
    ];

    const agents: AgentStatus[] = agentMappings.map(({ catalogId, openclawAgentId }) => ({
      ...deriveAgentStatus(openclawAgentId, openclawStatus),
      ...AGENT_CATALOG[catalogId],
      sourceAgentId: openclawAgentId,
    }));

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
