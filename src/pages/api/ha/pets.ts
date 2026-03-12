// src/pages/api/ha/pets.ts
// API endpoint to fetch pet locations from Home Assistant

import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

const PET_ENTITIES = {
  diggy: 'sensor.diggy_big_beacon_area',
  theo: 'sensor.theo_white_ibeacon_area',
};

async function getEntityState(entityId: string) {
  if (!HA_URL || !HA_TOKEN) return null;

  try {
    const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
      headers: {
        Authorization: `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HA_URL || !HA_TOKEN) {
    return res.status(500).json({ error: 'Missing HA_URL or HA_TOKEN' });
  }

  try {
    const [diggyState, theoState] = await Promise.all([
      getEntityState(PET_ENTITIES.diggy),
      getEntityState(PET_ENTITIES.theo),
    ]);

    const pets = [
      {
        name: 'Diggy',
        entityId: PET_ENTITIES.diggy,
        location: diggyState?.state || 'Unknown',
        lastUpdated: diggyState?.last_updated || new Date().toISOString(),
      },
      {
        name: 'Theo',
        entityId: PET_ENTITIES.theo,
        location: theoState?.state || 'Unknown',
        lastUpdated: theoState?.last_updated || new Date().toISOString(),
      },
    ];

    res.status(200).json(pets);
  } catch (error) {
    console.error('Pet tracker API error:', error);
    res.status(500).json({ error: 'Failed to fetch pet locations' });
  }
}
