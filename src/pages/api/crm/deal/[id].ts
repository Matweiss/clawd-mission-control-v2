import type { NextApiRequest, NextApiResponse } from 'next';
import {
  isHubSpotConfigured,
  getDealWithAssociations,
  getContact,
  getCompany,
  updateDealStage,
} from '../../../../lib/hubspot';
import { agentNameOrFallback } from '../../../../lib/agents';
import { getValidGoogleToken } from '../../auth/refresh-google';

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL || 'https://paperclip.thematweiss.com';
const PAPERCLIP_API_KEY = process.env.PAPERCLIP_API_KEY_STABLE || process.env.PAPERCLIP_API_KEY;
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
}

interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  location: string | null;
}

interface GmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  url: string;
}

interface LinkedTask {
  id: string;
  identifier: string | null;
  title: string;
  rawStatus: string;
  assignee: string | null;
  url: string;
  updatedAt: string | null;
}

async function fetchContacts(ids: string[]): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const results = await Promise.allSettled(ids.slice(0, 8).map((id) => getContact(id)));
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map((r) => {
      const p = r.value.properties || {};
      const name = [p.firstname, p.lastname].filter(Boolean).join(' ').trim() || p.email || 'Unknown';
      return {
        id: r.value.id,
        name,
        email: p.email || null,
        phone: p.phone || null,
        jobTitle: p.jobtitle || null,
        company: p.company || null,
      };
    });
}

async function fetchCompanies(ids: string[]): Promise<Company[]> {
  if (ids.length === 0) return [];
  const results = await Promise.allSettled(ids.slice(0, 4).map((id) => getCompany(id)));
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map((r) => {
      const p = r.value.properties || {};
      const location = [p.city, p.state].filter(Boolean).join(', ');
      return {
        id: r.value.id,
        name: p.name || 'Unknown',
        domain: p.domain || null,
        industry: p.industry || null,
        location: location || null,
      };
    });
}

async function fetchGmailThreads(emails: string[]): Promise<GmailThread[]> {
  const token = await getValidGoogleToken();
  if (!token || emails.length === 0) return [];

  // Build a query that ORs all the contact emails; cap to first 4 to keep
  // the query string reasonable.
  const targets = emails.filter(Boolean).slice(0, 4);
  if (targets.length === 0) return [];
  const query = targets.map((e) => `(from:${e} OR to:${e})`).join(' OR ');

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=8`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!listRes.ok) return [];
  const listData = await listRes.json();
  const ids: string[] = (listData.messages || []).map((m: any) => m.id).slice(0, 6);
  if (ids.length === 0) return [];

  const detailResults = await Promise.allSettled(
    ids.map((id) =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }).then((r) => (r.ok ? r.json() : null))
    )
  );

  return detailResults
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !!r.value)
    .map((r) => {
      const msg = r.value;
      const headers = msg.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(no subject)';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
      const date = headers.find((h: any) => h.name === 'Date')?.value || '';
      return {
        id: msg.id,
        subject,
        from,
        snippet: msg.snippet || '',
        date,
        url: `https://mail.google.com/mail/u/0/#inbox/${msg.threadId || msg.id}`,
      };
    });
}

async function fetchLinkedPaperclipTasks(dealName: string, contactNames: string[]): Promise<LinkedTask[]> {
  if (!PAPERCLIP_API_KEY || !PAPERCLIP_COMPANY_ID) return [];

  // Pull active issues once; match by case-insensitive substring on title/description.
  const res = await fetch(
    `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?status=todo,in_progress,blocked&limit=200`,
    { headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const issues: any[] = Array.isArray(data) ? data : data.issues || data.data || [];

  const needles = [dealName, ...contactNames]
    .map((s) => (s || '').toLowerCase().trim())
    .filter((s) => s.length >= 3); // skip super-short names that match everything

  if (needles.length === 0) return [];

  return issues
    .filter((issue) => {
      const haystack = `${issue.title || ''} ${issue.description || ''}`.toLowerCase();
      return needles.some((n) => haystack.includes(n));
    })
    .slice(0, 8)
    .map((issue) => ({
      id: issue.id,
      identifier: issue.identifier ?? null,
      title: issue.title ?? 'Paperclip task',
      rawStatus: issue.status ?? '',
      assignee: issue.assigneeAgentId ? agentNameOrFallback(issue.assigneeAgentId, 'Agent') : null,
      url: `${PAPERCLIP_API_URL.replace(/\/+$/, '')}/issues/${issue.identifier ?? issue.id}`,
      updatedAt: issue.updatedAt ?? null,
    }));
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  if (!isHubSpotConfigured()) {
    return res.status(500).json({ error: 'HubSpot env not configured' });
  }

  try {
    const deal = await getDealWithAssociations(dealId);
    const contactIds = (deal.associations?.contacts?.results || []).map((c) => c.id);
    const companyIds = (deal.associations?.companies?.results || []).map((c) => c.id);

    const [contacts, companies] = await Promise.all([
      fetchContacts(contactIds),
      fetchCompanies(companyIds),
    ]);

    const dealName = deal.properties.dealname || '';
    const contactNames = contacts.map((c) => c.name);
    const emails = contacts.map((c) => c.email).filter(Boolean) as string[];

    const [gmail, paperclipTasks] = await Promise.all([
      fetchGmailThreads(emails),
      fetchLinkedPaperclipTasks(dealName, contactNames),
    ]);

    return res.status(200).json({
      deal: {
        id: deal.id,
        name: dealName,
        amount: deal.properties.amount ? Number(deal.properties.amount) : null,
        stage: deal.properties.dealstage,
        pipeline: deal.properties.pipeline,
        closeDate: deal.properties.closedate,
        description: deal.properties.description,
        createdAt: deal.properties.createdate,
        lastModified: deal.properties.hs_lastmodifieddate,
        ownerId: deal.properties.hubspot_owner_id,
        url: `https://app.hubspot.com/contacts/deals/${deal.id}`,
      },
      contacts,
      companies,
      gmail,
      paperclipTasks,
      // Phase 2 placeholders — populated once Composio project has Notion/Granola connected accounts.
      notion: { connected: false, note: 'Notion drawer section pending — link Notion at platform.composio.dev for this project.' },
      granola: { connected: false, note: 'Granola drawer section pending — needs VPS-side sync (Granola is a local CLI MCP, not a public Composio toolkit).' },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch deal context', detail: err?.message });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, dealId: string) {
  const body = (req.body || {}) as { stageId?: string };
  const stageId = String(body.stageId || '').trim();
  if (!stageId) return res.status(400).json({ error: 'stageId is required' });

  try {
    const updated = await updateDealStage(dealId, stageId);
    return res.status(200).json({
      deal: {
        id: updated.id,
        stage: updated.properties.dealstage,
        lastModified: updated.properties.hs_lastmodifieddate,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update stage', detail: err?.message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dealId = String(req.query.id || '').trim();
  if (!dealId) return res.status(400).json({ error: 'Missing deal id' });

  if (req.method === 'GET') return handleGet(req, res, dealId);
  if (req.method === 'PATCH') return handlePatch(req, res, dealId);

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}
