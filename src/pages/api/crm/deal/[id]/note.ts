import type { NextApiRequest, NextApiResponse } from 'next';
import { isHubSpotConfigured, hubSpotRequest } from '../../../../../lib/hubspot';

const HUBSPOT_OWNER_ID = (process.env.HUBSPOT_OWNER_ID || '').trim();

// Default HubSpot association type id for note → deal.
const NOTE_TO_DEAL = 214;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isHubSpotConfigured()) {
    return res.status(500).json({ error: 'HubSpot env not configured' });
  }

  const dealId = String(req.query.id || '').trim();
  if (!dealId) return res.status(400).json({ error: 'Missing deal id' });

  const body = (req.body || {}) as { note?: string };
  const text = String(body.note || '').trim();
  if (!text) return res.status(400).json({ error: 'note is required' });

  // HubSpot notes render HTML; escape and convert newlines so plain text is safe.
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const properties: Record<string, string> = {
    hs_note_body: html,
    hs_timestamp: String(Date.now()),
  };
  if (HUBSPOT_OWNER_ID) properties.hubspot_owner_id = HUBSPOT_OWNER_ID;

  try {
    const note = await hubSpotRequest<{ id: string; properties: Record<string, string> }>(
      '/crm/v3/objects/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          properties,
          associations: [
            { to: { id: dealId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: NOTE_TO_DEAL }] },
          ],
        }),
      }
    );
    return res.status(201).json({ ok: true, noteId: note.id });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to log note', detail: err?.message });
  }
}
