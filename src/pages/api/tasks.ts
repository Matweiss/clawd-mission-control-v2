import type { NextApiRequest, NextApiResponse } from 'next';
import { agentNameOrFallback, AGENT_BY_ID } from '../../lib/agents';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

const ALLOWED_CREATE_PRIORITY = new Set(['low', 'medium', 'high', 'critical', 'urgent']);
const ALLOWED_CREATE_STATUS = new Set(['todo', 'backlog', 'in_progress', 'blocked']);

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';

function mapPriority(p: unknown): TaskPriority {
  const v = typeof p === 'string' ? p.toLowerCase() : '';
  if (v === 'critical' || v === 'urgent' || v === 'high') return 'high';
  if (v === 'medium' || v === 'normal') return 'medium';
  return 'low';
}

function mapStatus(s: unknown): TaskStatus {
  const v = typeof s === 'string' ? s.toLowerCase() : '';
  if (v === 'blocked' || v === 'on_hold' || v === 'waiting') return 'blocked';
  if (v === 'in_progress' || v === 'in_review' || v === 'review' || v === 'started') return 'in_progress';
  if (v === 'done' || v === 'completed' || v === 'closed' || v === 'released') return 'completed';
  return 'pending';
}

function paperclipIssueUrl(identifierOrId: string) {
  return `${PAPERCLIP_API_URL.replace(/\/+$/, '')}/issues/${identifierOrId}`;
}

function pickArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.issues)) return payload.issues;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function projectName(issue: any): string | null {
  if (typeof issue?.project?.name === 'string') return issue.project.name;
  if (typeof issue?.projectName === 'string') return issue.projectName;
  if (typeof issue?.project === 'string') return issue.project;
  return null;
}

function normalizeIssue(issue: any) {
  const identifier: string | null = issue.identifier ?? null;
  const id: string = issue.id;
  const rawStatus: string = typeof issue.status === 'string' ? issue.status : '';
  const assigneeAgentId: string | null = issue.assigneeAgentId ?? null;
  const assignee = agentNameOrFallback(assigneeAgentId, 'Agent');

  return {
    id,
    identifier,
    title: issue.title ?? 'Untitled Paperclip task',
    priority: mapPriority(issue.priority),
    status: mapStatus(rawStatus),
    rawStatus,
    assignee,
    assigneeAgentId,
    assigneeUserId: issue.assigneeUserId ?? null,
    dueDate: issue.dueDate ?? null,
    project: projectName(issue),
    description: issue.description ?? issue.body ?? null,
    createdAt: issue.createdAt ?? null,
    updatedAt: issue.updatedAt ?? null,
    lastActivityAt: issue.lastActivityAt ?? issue.updatedAt ?? null,
    url: paperclipIssueUrl(identifier ?? id),
  };
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(
      `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?status=todo,in_progress,blocked,done,completed&limit=100`,
      { headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` } }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Paperclip API error', tasks: [] });
    }

    const data = await response.json();
    const raw = pickArray(data);

    const tasks = raw
      .filter((issue) => issue && typeof issue.id === 'string')
      .map(normalizeIssue);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch tasks', tasks: [] });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const body = (req.body || {}) as {
    title?: string;
    description?: string | null;
    priority?: string;
    status?: string;
    assigneeAgentId?: string | null;
  };

  const title = String(body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (title.length > 200) return res.status(400).json({ error: 'title must be ≤200 characters' });

  const payload: Record<string, unknown> = { title };
  if (typeof body.description === 'string' && body.description.trim().length > 0) {
    payload.description = body.description.trim();
  }
  if (body.priority !== undefined) {
    if (!ALLOWED_CREATE_PRIORITY.has(body.priority)) {
      return res.status(400).json({ error: `Invalid priority: ${body.priority}` });
    }
    payload.priority = body.priority;
  }
  if (body.status !== undefined) {
    if (!ALLOWED_CREATE_STATUS.has(body.status)) {
      return res.status(400).json({ error: `Invalid status: ${body.status}` });
    }
    payload.status = body.status;
  }
  if (body.assigneeAgentId !== undefined && body.assigneeAgentId !== null) {
    if (!AGENT_BY_ID[body.assigneeAgentId]) {
      return res.status(400).json({ error: `Unknown agent id: ${body.assigneeAgentId}` });
    }
    payload.assigneeAgentId = body.assigneeAgentId;
  }

  try {
    const upstream = await fetch(
      `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const raw = await upstream.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { /* non-JSON */ }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: 'Paperclip create failed',
        status: upstream.status,
        body: parsed ?? raw.slice(0, 500),
      });
    }

    return res.status(201).json({ task: normalizeIssue(parsed) });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create task', detail: err?.message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!PAPERCLIP_API_KEY || !PAPERCLIP_COMPANY_ID) {
    return res.status(500).json({ error: 'Paperclip env not configured', tasks: [] });
  }

  if (req.method === 'GET') return handleGet(req, res);
  if (req.method === 'POST') return handlePost(req, res);

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
