import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeOpenClawAgentId, runOpenClawJson } from '../../../lib/openclaw-cli';

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


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawAgentId = String(req.query.agentId || '');
  const openclawAgentId = normalizeOpenClawAgentId(rawAgentId);
  const status = runOpenClawJson<OpenClawStatusPayload>(['status'], {} as OpenClawStatusPayload);

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
