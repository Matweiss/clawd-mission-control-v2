import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeOpenClawAgentId, runOpenClawJson } from '../../../lib/openclaw-cli';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, action } = req.body || {};
  const normalized = normalizeOpenClawAgentId(String(agentId || ''));

  if (!agentId || !action) {
    return res.status(400).json({ error: 'agentId and action are required' });
  }

  if (action === 'refresh') {
    const status = runOpenClawJson(['status'], {});
    return res.status(200).json({ ok: true, action, agentId, normalizedAgentId: normalized, status });
  }

  if (action === 'inspect') {
    const sessions = runOpenClawJson(['sessions', '--agent', normalized], [], 8000);
    return res.status(200).json({ ok: true, action, agentId, normalizedAgentId: normalized, sessions });
  }

  if (action === 'restart') {
    const sessions = runOpenClawJson(['sessions', '--agent', normalized], [], 8000);
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
