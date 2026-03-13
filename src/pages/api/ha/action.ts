import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL || '';
const HA_TOKEN = process.env.HA_TOKEN || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entity_id, action, ...params } = req.body;

  if (!entity_id || !action) {
    return res.status(400).json({ error: 'Missing entity_id or action' });
  }

  try {
    const domain = entity_id.split('.')[0];
    let service = action;

    // Map actions to services
    if (action === 'toggle') {
      service = 'toggle';
    } else if (action === 'on') {
      service = 'turn_on';
    } else if (action === 'off') {
      service = 'turn_off';
    } else if (action === 'lock') {
      service = 'lock';
    } else if (action === 'unlock') {
      service = 'unlock';
    }

    const response = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_id,
        ...params
      }),
    });

    if (!response.ok) {
      throw new Error(`HA API error: ${response.status}`);
    }

    const result = await response.json();
    return res.status(200).json({ success: true, result });

  } catch (error) {
    console.error('HA Action API Error:', error);
    return res.status(500).json({
      error: 'Failed to execute action',
      details: (error as Error).message
    });
  }
}
