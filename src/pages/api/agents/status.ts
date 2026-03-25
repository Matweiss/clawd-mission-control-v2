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
}

function makeMockSessionTree(): SessionNode[] {
  return [
    {
      id: 'sess-root-orchestrator',
      parentId: null,
      name: 'CLAWD Prime Orchestration',
      agentType: 'orchestrator',
      status: 'streaming',
      startTime: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      depth: 0,
      children: [
        {
          id: 'sess-build-1',
          parentId: 'sess-root-orchestrator',
          name: 'Build Agent · Dashboard pass',
          agentType: 'build',
          status: 'thinking',
          startTime: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
          depth: 1,
          children: [
            {
              id: 'sess-build-2',
              parentId: 'sess-build-1',
              name: 'Context meter component',
              agentType: 'build',
              status: 'done',
              startTime: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
              depth: 2,
              children: [],
            },
            {
              id: 'sess-build-3',
              parentId: 'sess-build-1',
              name: 'Session tree wiring',
              agentType: 'build',
              status: 'streaming',
              startTime: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              depth: 2,
              children: [],
            },
          ],
        },
        {
          id: 'sess-work-1',
          parentId: 'sess-root-orchestrator',
          name: 'Work Agent · Ops monitor',
          agentType: 'work',
          status: 'idle',
          startTime: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
          depth: 1,
          children: [],
        },
        {
          id: 'sess-research-1',
          parentId: 'sess-root-orchestrator',
          name: 'Research Agent · design scan',
          agentType: 'research',
          status: 'error',
          startTime: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
          depth: 1,
          children: [],
        },
      ],
    },
  ];
}

function countDescendants(node: SessionNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

function sessionLoadForAgent(agentId: string, sessionTree: SessionNode[]) {
  const mapping: Record<string, string[]> = {
    'clawd-prime': ['sess-root-orchestrator'],
    'work-agent': ['sess-work-1'],
    'lifestyle-agent': [],
    'build-agent': ['sess-build-1', 'sess-build-2', 'sess-build-3'],
    'email-agent': [],
    'hubspot-agent': [],
    'research-agent': ['sess-research-1'],
  };

  const ids = new Set(mapping[agentId] || []);

  const flatten = (nodes: SessionNode[]): SessionNode[] =>
    nodes.flatMap((node) => [node, ...flatten(node.children)]);

  const relevant = flatten(sessionTree).filter((node) => ids.has(node.id));
  return relevant.length;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let openclawStatus: any = {};
    try {
      const statusOutput = execSync('openclaw status --json 2>/dev/null || echo "{}"', {
        encoding: 'utf8',
        timeout: 5000,
      });
      openclawStatus = JSON.parse(statusOutput);
    } catch (e) {
      console.log('OpenClaw status not available');
    }

    let sessions: any[] = [];
    try {
      const sessionsOutput = execSync('openclaw sessions list --json 2>/dev/null || echo "[]"', {
        encoding: 'utf8',
        timeout: 5000,
      });
      sessions = JSON.parse(sessionsOutput);
    } catch (e) {
      console.log('Sessions not available');
    }

    const sessionTree = makeMockSessionTree();
    const contextMax = 128000;

    const agents: AgentStatus[] = [
      {
        id: 'clawd-prime',
        name: 'CLAWD Prime',
        emoji: '🦞',
        color: 'work',
        role: 'Director & Orchestrator',
        level: 1,
        status: sessions.length > 0 ? 'running' : 'idle',
        lastActive: sessions[0]?.lastActive || new Date().toISOString(),
        contextUsed: 81234,
        contextMax,
        subagentCount: countDescendants(sessionTree[0]),
      },
      {
        id: 'work-agent',
        name: 'Work Agent',
        emoji: '🤖',
        color: 'work',
        role: 'Sales & Business Operations',
        level: 2,
        status: 'idle',
        lastActive: new Date().toISOString(),
        contextUsed: 28410,
        contextMax,
        subagentCount: sessionLoadForAgent('work-agent', sessionTree),
      },
      {
        id: 'lifestyle-agent',
        name: 'Lifestyle Agent',
        emoji: '🧘',
        color: 'lifestyle',
        role: 'Wellness & Life Balance',
        level: 2,
        status: 'idle',
        lastActive: new Date().toISOString(),
        contextUsed: 19024,
        contextMax,
        subagentCount: sessionLoadForAgent('lifestyle-agent', sessionTree),
      },
      {
        id: 'build-agent',
        name: 'Build Agent',
        emoji: '🔧',
        color: 'build',
        role: 'Engineering & Infrastructure',
        level: 2,
        status: 'running',
        lastActive: new Date().toISOString(),
        contextUsed: 101920,
        contextMax,
        subagentCount: sessionLoadForAgent('build-agent', sessionTree),
      },
      {
        id: 'email-agent',
        name: 'Email Agent',
        emoji: '📧',
        color: 'email',
        role: 'Inbox Monitor → Work Agent',
        level: 3,
        status: 'offline',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        contextUsed: 4200,
        contextMax,
        subagentCount: 0,
      },
      {
        id: 'hubspot-agent',
        name: 'HubSpot Agent',
        emoji: '📊',
        color: 'hubspot',
        role: 'CRM Data → Work Agent',
        level: 3,
        status: 'offline',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        contextUsed: 6100,
        contextMax,
        subagentCount: 0,
      },
      {
        id: 'research-agent',
        name: 'Research Agent',
        emoji: '🔍',
        color: 'research',
        role: 'Intelligence Gathering',
        level: 3,
        status: 'weekend',
        lastActive: new Date(Date.now() - 172800000).toISOString(),
        contextUsed: 92340,
        contextMax,
        subagentCount: sessionLoadForAgent('research-agent', sessionTree),
      },
    ];

    return res.status(200).json({
      agents,
      sessionTree,
      openclaw: {
        gateway: openclawStatus.gateway?.state || 'unknown',
        nodes: openclawStatus.nodes?.length || 0,
        sessions: sessions.length || sessionTree.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agent status API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch agent status',
      agents: [],
      sessionTree: [],
    });
  }
}
