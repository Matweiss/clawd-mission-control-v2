import type { NextApiRequest, NextApiResponse } from 'next';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

// Map Paperclip agent IDs to display names
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

function mapPriority(p: string): 'high' | 'medium' | 'low' {
  if (p === 'critical' || p === 'high') return 'high';
  if (p === 'medium') return 'medium';
  return 'low';
}

function mapStatus(s: string): 'pending' | 'in_progress' | 'completed' {
  if (s === 'in_progress' || s === 'in_review') return 'in_progress';
  if (s === 'done' || s === 'completed' || s === 'closed') return 'completed';
  return 'pending';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!PAPERCLIP_API_KEY || !PAPERCLIP_COMPANY_ID) {
    return res.status(500).json({ error: 'Paperclip env not configured' });
  }

  try {
    const response = await fetch(
      `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?status=todo,in_progress,blocked,done,completed&limit=75`,
      { headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` } }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Paperclip API error' });
    }

    const data = await response.json();
    const raw: any[] = data.issues ?? data.data ?? (Array.isArray(data) ? data : []);

    const tasks = raw.map((issue: any) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      priority: mapPriority(issue.priority),
      status: mapStatus(issue.status),
      assignee: issue.assigneeAgentId ? (AGENT_NAMES[issue.assigneeAgentId] ?? 'Agent') : null,
      dueDate: issue.dueDate ?? null,
      project: issue.project?.name ?? issue.projectName ?? null,
      description: issue.description ?? issue.body ?? null,
    }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}
