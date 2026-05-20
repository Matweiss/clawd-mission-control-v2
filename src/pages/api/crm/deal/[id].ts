import type { NextApiRequest, NextApiResponse } from 'next';
import {
  isHubSpotConfigured,
  getDealWithAssociations,
  getContact,
  getCompany,
  updateDealStage,
} from '../../../../lib/hubspot';
import { agentNameOrFallback } from '../../../../lib/agents';
import {
  isComposioConfigured,
  searchNotionPages,
  searchGmailThreads,
  listRecentGranolaMeetings,
  filterMeetingsForQuery,
  type NotionPageHit,
  type GranolaMeeting,
} from '../../../../lib/composio';

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

// Gmail read goes through the Composio MCP (work account) — the Google OAuth
// refresh token is dead, so the old direct-API path returned nothing.
async function fetchGmailThreads(emails: string[]): Promise<GmailThread[]> {
  if (emails.length === 0) return [];
  return searchGmailThreads(emails, 6);
}

async function fetchLinkedPaperclipTasks(dealName: string, names: string[]): Promise<LinkedTask[]> {
  if (!PAPERCLIP_API_KEY || !PAPERCLIP_COMPANY_ID) return [];

  // Pull active issues once; match by case-insensitive substring on title/description.
  const res = await fetch(
    `${PAPERCLIP_API_URL}/api/companies/${PAPERCLIP_COMPANY_ID}/issues?status=todo,in_progress,blocked&limit=200`,
    { headers: { Authorization: `Bearer ${PAPERCLIP_API_KEY}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const issues: any[] = Array.isArray(data) ? data : data.issues || data.data || [];

  // Match on the company/contact names AND a short stem of the deal name (its
  // first 2 words), so a task titled "YouTopia Sports — …" links even though
  // the full HubSpot deal name is much longer.
  const dealStem = dealName.split(/\s+/).slice(0, 2).join(' ');
  const needles = [dealStem, ...names]
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

async function fetchNotionContext(searchTerms: string[]) {
  if (!isComposioConfigured()) {
    return { connected: false, pages: [] as NotionPageHit[], note: 'Notion not connected — set COMPOSIO_API_KEY and link Notion at platform.composio.dev.' };
  }
  // Search Notion for the deal name (best single signal). Falls back to empty.
  const primary = searchTerms[0] || '';
  if (!primary) return { connected: true, pages: [], note: 'No deal name to search Notion with.' };
  try {
    const pages = await searchNotionPages(primary, 5);
    return { connected: true, pages, note: pages.length === 0 ? 'No matching Notion pages.' : null };
  } catch (err: any) {
    return { connected: true, pages: [], note: err?.message || 'Notion lookup failed.' };
  }
}

async function fetchGranolaContext(searchTerms: string[]) {
  if (!isComposioConfigured()) {
    return { connected: false, meetings: [] as GranolaMeeting[], note: 'Granola not connected — set COMPOSIO_API_KEY and ensure Granola is linked to the project.' };
  }
  try {
    const all = await listRecentGranolaMeetings('last_30_days');
    const matched = filterMeetingsForQuery(all, searchTerms).slice(0, 6);
    return {
      connected: true,
      meetings: matched,
      note: matched.length === 0 ? 'No recent meetings mention this deal or company.' : null,
    };
  } catch (err: any) {
    return { connected: true, meetings: [], note: err?.message || 'Granola lookup failed.' };
  }
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

    const companyNames = companies.map((c) => c.name);
    const searchTerms = [dealName, ...companyNames].filter(Boolean);

    const [gmail, paperclipTasks, notion, granola] = await Promise.all([
      fetchGmailThreads(emails),
      fetchLinkedPaperclipTasks(dealName, [...companyNames, ...contactNames]),
      fetchNotionContext(searchTerms),
      fetchGranolaContext(searchTerms),
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
      notion,
      granola,
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
