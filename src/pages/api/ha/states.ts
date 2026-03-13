import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL || '';
const HA_TOKEN = process.env.HA_TOKEN || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${HA_URL}/api/states`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HA API error: ${response.status}`);
    }

    const states = await response.json();
    
    // Filter out some noise and return relevant entities
    const filtered = states.filter((entity: any) => {
      const domain = entity.entity_id.split('.')[0];
      // Include useful domains
      return [
        'light', 'switch', 'lock', 'climate', 'thermostat',
        'cover', 'fan', 'media_player', 'sensor', 'binary_sensor',
        'device_tracker', 'person', 'input_boolean'
      ].includes(domain);
    });

    return res.status(200).json(filtered);

  } catch (error) {
    console.error('HA States API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch HA states',
      details: (error as Error).message
    });
  }
}
