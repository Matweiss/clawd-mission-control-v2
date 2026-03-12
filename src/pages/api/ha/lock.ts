import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entityId, action } = req.body;

  if (!entityId || !action) {
    return res.status(400).json({ error: 'Missing entityId or action' });
  }

  if (!HA_URL || !HA_TOKEN) {
    return res.status(500).json({ error: 'Missing HA_URL or HA_TOKEN' });
  }

  // Validate action
  if (action !== 'lock' && action !== 'unlock') {
    return res.status(400).json({ error: 'Invalid action. Must be "lock" or "unlock"' });
  }

  try {
    const response = await fetch(`${HA_URL}/api/services/lock/${action}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entity_id: entityId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `Home Assistant error: ${errorText}` });
    }

    return res.status(200).json({ success: true, entityId, action });
  } catch (error) {
    return res.status(500).json({ error: `Failed to ${action} door: ${error}` });
  }
}
