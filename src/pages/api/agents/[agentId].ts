import type { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';

interface OpenClawRecentSession {
  agentId?: string;
  key?: string;
  kind?: string;
  sessionId?: string;
  updatedAt?: number;
  age?: number;
  totalTokens?: number | null;
  percentUsed?: number | null;
  model?: string;
  contextTokens?: number;
  abortedLastRun?: boolean;
  flags?: string[];
}

interface OpenClawStatusPayload {
  sessions?: {
    byAgent?: Array<{
      agentId: string;
      count?: number;
      recent?: OpenClawRecentSession[];
    }>;
    recent?: OpenClawRecentSession[];
  };
}

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

function normalizeAgentId(agentId: string) {
  if (agentId === 'clawd-prime' || agentId === 'work-agent' || agentId === 'build-agent' || agentId === 'email-agent' || agentId === 'hubspot-agent') return 'main';
  if (agentId === 'lifestyle-agent' || agentId === 'research-agent') return 'sarah';
  return agentId;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawAgentId = String(req.query.agentId || '');
  const openclawAgentId = normalizeAgentId(rawAgentId);
  const status = parseJson<OpenClawStatusPayload>('openclaw status --json || echo "{}"', {} as OpenClawStatusPayload);

  const byAgent = status.sessions?.byAgent || [];
  const recent = byAgent.find((entry) => entry.agentId === openclawAgentId)?.recent || [];

  const history = recent.slice(0, 10).map((session, idx) => ({
    id: session.sessionId || `${openclawAgentId}-${idx}`,
    title: session.key || session.sessionId || 'OpenClaw session',
    timestamp: new Date(session.updatedAt || Date.now()).toISOString(),
    status: session.abortedLastRun ? 'error' : (session.age || Number.MAX_SAFE_INTEGER) < 10 * 60 * 1000 ? 'active' : 'recent',
    model: session.model || 'unknown',
    tokens: session.totalTokens,
    percentUsed: session.percentUsed,
    kind: session.kind || 'direct',
  }));

  return res.status(200).json({
    agentId: rawAgentId,
    openclawAgentId,
    count: history.length,
    history,
  });
}
