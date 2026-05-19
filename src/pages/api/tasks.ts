import type { NextApiRequest, NextApiResponse } from 'next';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

// Map Paperclip agent IDs to display names — kept in sync with src/pages/mat.tsx roster.
const AGENT_NAMES: Record<string, string> = {
  'a0edadcb-f994-40e3-a9a1-d3ffde595c3e': 'Clawd',
  '6ec7b59f-8955-4d21-b4c3-c4b5a68772c8': 'Vandalay',
  '1ef5e05b-7a16-4ebc-8c05-cdb03a321197': 'Sloan',
  'fd4efc78-5969-47f3-878a-457654682548': 'Bob',
  '8c40bdd4-7e82-40a7-9fa7-982b0931d705': 'Luke',
  'd61e45f1-a8ad-4c2c-afeb-1cad12ec17c6': 'Sage',
  'e6822182-3611-4152-a1f2-aab9975fce3d': 'Hermes',
  'dd20d11e-6a2e-4de1-bdfd-c068b5f1499f': 'Scout',
  '951c871e-fcb0-4211-bf92-19b0812d16bd': 'Pixel',
  '61ee0d8e-ac57-47bc-8402-5d3a756427ad': 'Arty',
};

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
        const assignee = assigneeAgentId ? (AGENT_NAMES[assigneeAgentId] ?? 'Agent') : null;

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
