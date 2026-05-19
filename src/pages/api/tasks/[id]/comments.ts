import type { NextApiRequest, NextApiResponse } from 'next';
import { agentNameOrFallback } from '../../../../lib/agents';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;

interface PaperclipComment {
  id: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
  authorAgentId?: string | null;
  authorUserId?: string | null;
}

function authorLabel(comment: any): string {
  const agent = comment?.authorAgentId ? agentNameOrFallback(comment.authorAgentId, 'Agent') : null;
  if (agent) return agent;
  if (comment?.authorUserId) return 'User';
  return 'Paperclip';
}

function normalize(comment: any) {
  return {
    id: comment?.id ?? null,
    body: String(comment?.body ?? '').trim(),
    createdAt: comment?.createdAt ?? null,
    updatedAt: comment?.updatedAt ?? null,
    authorAgentId: comment?.authorAgentId ?? null,
    authorUserId: comment?.authorUserId ?? null,
    author: authorLabel(comment),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!PAPERCLIP_API_KEY) {
    return res.status(500).json({ error: 'Paperclip env not configured' });
  }

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Missing task id' });

  const upstreamHeaders = {
    Authorization: `Bearer ${PAPERCLIP_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const upstreamUrl = `${PAPERCLIP_API_URL}/api/issues/${encodeURIComponent(id)}/comments`;

  if (req.method === 'GET') {
    try {
      const upstream = await fetch(upstreamUrl, { headers: upstreamHeaders });
      const raw = await upstream.text();
      let parsed: any = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { /* non-JSON */ }

      if (!upstream.ok) {
        return res.status(upstream.status).json({
          error: 'Paperclip comments fetch failed',
          status: upstream.status,
          body: parsed ?? raw.slice(0, 500),
        });
      }

      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.comments) ? parsed.comments : [];
      const comments = list.map(normalize).filter((c: any) => c.body);
      comments.sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      return res.status(200).json({ comments });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch comments', detail: err?.message });
    }
  }

  if (req.method === 'POST') {
    const body = (req.body || {}) as { body?: string };
    const text = String(body.body || '').trim();
    if (!text) return res.status(400).json({ error: 'Comment body is required' });

    try {
      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: upstreamHeaders,
        body: JSON.stringify({ body: text }),
      });
      const raw = await upstream.text();
      let parsed: any = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { /* non-JSON */ }

      if (!upstream.ok) {
        return res.status(upstream.status).json({
          error: 'Paperclip comment post failed',
          status: upstream.status,
          body: parsed ?? raw.slice(0, 500),
        });
      }

      return res.status(201).json({ comment: normalize(parsed) });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to post comment', detail: err?.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
