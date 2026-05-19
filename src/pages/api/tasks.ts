import type { NextApiRequest, NextApiResponse } from 'next';
import { agentNameOrFallback } from '../../lib/agents';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!PAPERCLIP_API_KEY || !PAPERCLIP_COMPANY_ID) {
    return res.status(500).json({ error: 'Paperclip env not configured', tasks: [] });
  }

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
      .map((issue: any) => {
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
      });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch tasks', tasks: [] });
  }
}
