import type { NextApiRequest, NextApiResponse } from 'next';
import { isHubSpotConfigured, getDealWithAssociations, getContact } from '../../../../../lib/hubspot';
import {
  isComposioConfigured,
  createGmailDraft,
  listRecentGranolaMeetings,
  filterMeetingsForQuery,
} from '../../../../../lib/composio';

interface Contact {
  name: string;
  firstName: string;
  email: string | null;
}

async function primaryContact(contactIds: string[]): Promise<Contact | null> {
  for (const id of contactIds.slice(0, 8)) {
    try {
      const c = await getContact(id);
      const p = c.properties || {};
      if (p.email) {
        return {
          name: [p.firstname, p.lastname].filter(Boolean).join(' ').trim() || p.email,
          firstName: p.firstname || '',
          email: p.email,
        };
      }
    } catch { /* skip */ }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isHubSpotConfigured()) return res.status(500).json({ error: 'HubSpot env not configured' });
  if (!isComposioConfigured()) return res.status(500).json({ error: 'COMPOSIO_MCP_KEY not configured' });

  const dealId = String(req.query.id || '').trim();
  if (!dealId) return res.status(400).json({ error: 'Missing deal id' });

  try {
    const deal = await getDealWithAssociations(dealId);
    const dealName = deal.properties.dealname || 'our conversation';
    const contactIds = (deal.associations?.contacts?.results || []).map((c) => c.id);
    const contact = await primaryContact(contactIds);

    if (!contact?.email) {
      return res.status(422).json({ error: 'No contact with an email on this deal — add one in HubSpot first.' });
    }

    // Pull the most recent meeting that mentions the deal/company for context.
    let meetingLine = '';
    try {
      const meetings = await listRecentGranolaMeetings('last_30_days');
      const matched = filterMeetingsForQuery(meetings, [dealName]);
      if (matched[0]) meetingLine = ` following up on ${matched[0].title}`;
    } catch { /* non-fatal */ }

    const greetingName = contact.firstName || contact.name.split(' ')[0] || 'there';
    const subject = `Following up — ${dealName}`;
    const body = [
      `Hi ${greetingName},`,
      ``,
      `Thanks again for your time${meetingLine}. Wanted to follow up and keep things moving on ${dealName}.`,
      ``,
      `A few quick next steps on my mind:`,
      `- [recap the key point discussed]`,
      `- [the next deliverable / decision]`,
      `- [proposed timing for the next call]`,
      ``,
      `Let me know what works on your end and I'll get it scheduled. Happy to pull in anyone from my team who'd be helpful.`,
      ``,
      `Best,`,
      `Mat`,
    ].join('\n');

    const draft = await createGmailDraft({
      to: [contact.email],
      subject,
      body,
    });

    if (!draft.ok) {
      return res.status(502).json({ error: draft.error || 'Draft creation failed' });
    }

    return res.status(201).json({
      ok: true,
      to: contact.email,
      subject,
      draftId: draft.draftId,
      url: draft.url,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to draft email', detail: err?.message });
  }
}
