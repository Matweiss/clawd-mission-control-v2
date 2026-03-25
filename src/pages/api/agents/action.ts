import type { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';

function normalizeAgentId(agentId: string) {
  if (['clawd-prime', 'work-agent', 'build-agent', 'email-agent', 'hubspot-agent'].includes(agentId)) return 'main';
  if (['lifestyle-agent', 'research-agent'].includes(agentId)) return 'sarah';
  return agentId;
}

function runJson(command: string, fallback: any) {
  try {
    const out = execSync(command, {
      encoding: 'utf8',
      timeout: 8000,
      shell: '/bin/bash',
    });
    return JSON.parse(out);
  } catch {
    return fallback;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, action } = req.body || {};
  const normalized = normalizeAgentId(String(agentId || ''));

  if (!agentId || !action) {
    return res.status(400).json({ error: 'agentId and action are required' });
  }

  if (action === 'refresh') {
    const status = runJson('openclaw status --json || echo "{}"', {});
    return res.status(200).json({ ok: true, action, agentId, normalizedAgentId: normalized, status });
  }

  if (action === 'inspect') {
    const sessions = runJson(`openclaw sessions --agent ${normalized} --json || echo "[]"`, []);
    return res.status(200).json({ ok: true, action, agentId, normalizedAgentId: normalized, sessions });
  }

  if (action === 'restart') {
    const sessions = runJson(`openclaw sessions --agent ${normalized} --json || echo "[]"`, []);
    return res.status(200).json({
      ok: true,
      action,
      agentId,
      normalizedAgentId: normalized,
      mode: 'safe-nudge',
      message: 'Safe restart mode: inspected current sessions instead of killing/restarting processes.',
      sessions,
    });
  }

  return res.status(400).json({ error: `Unsupported action: ${action}` });
}
