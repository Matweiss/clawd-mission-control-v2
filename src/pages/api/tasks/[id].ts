import type { NextApiRequest, NextApiResponse } from 'next';
import { agentNameOrFallback, AGENT_BY_ID } from '../../../lib/agents';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;

// Paperclip's PATCH /api/issues/{id} accepts a partial issue. We only forward
// the fields the dashboard knows about today.
const ALLOWED_STATUS = new Set(['todo', 'in_progress', 'blocked', 'done', 'completed']);
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high', 'critical', 'urgent']);

interface PatchBody {
  status?: string;
  priority?: string;
  // Null clears the assignee.
  assigneeAgentId?: string | null;
  title?: string;
}

function projectName(issue: any): string | null {
  if (typeof issue?.project?.name === 'string') return issue.project.name;
  if (typeof issue?.projectName === 'string') return issue.projectName;
  if (typeof issue?.project === 'string') return issue.project;
  return null;
}

function paperclipIssueUrl(identifierOrId: string) {
  return `${PAPERCLIP_API_URL.replace(/\/+$/, '')}/issues/${identifierOrId}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!PAPERCLIP_API_KEY) {
    return res.status(500).json({ error: 'Paperclip env not configured' });
  }

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing task id' });

  if (req.method !== 'PATCH' && req.method !== 'POST') {
    res.setHeader('Allow', 'PATCH, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body || {}) as PatchBody;
  const patch: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.has(body.status)) {
      return res.status(400).json({ error: `Invalid status: ${body.status}` });
    }
    patch.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!ALLOWED_PRIORITY.has(body.priority)) {
      return res.status(400).json({ error: `Invalid priority: ${body.priority}` });
    }
    patch.priority = body.priority;
  }

  if (body.assigneeAgentId !== undefined) {
    if (body.assigneeAgentId !== null && !AGENT_BY_ID[body.assigneeAgentId]) {
      return res.status(400).json({ error: `Unknown agent id: ${body.assigneeAgentId}` });
    }
    patch.assigneeAgentId = body.assigneeAgentId;
  }

  if (typeof body.title === 'string' && body.title.trim().length > 0) {
    patch.title = body.title.trim();
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const response = await fetch(`${PAPERCLIP_API_URL}/api/issues/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });

    const raw = await response.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { /* non-JSON */ }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Paperclip PATCH failed',
        status: response.status,
        body: parsed ?? raw.slice(0, 500),
      });
    }

    // Re-shape the response into the same fields /api/tasks returns so the UI
    // can swap the row in place without a refetch.
    const issue = parsed || {};
    const identifier: string | null = issue.identifier ?? null;
    const assigneeAgentId: string | null = issue.assigneeAgentId ?? null;
    return res.status(200).json({
      task: {
        id: issue.id ?? id,
        identifier,
        title: issue.title ?? null,
        priority: issue.priority ?? null,
        rawStatus: issue.status ?? null,
        assignee: agentNameOrFallback(assigneeAgentId, 'Agent'),
        assigneeAgentId,
        project: projectName(issue),
        updatedAt: issue.updatedAt ?? null,
        lastActivityAt: issue.lastActivityAt ?? issue.updatedAt ?? null,
        url: paperclipIssueUrl(identifier ?? id),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to PATCH task', detail: err?.message });
  }
}
