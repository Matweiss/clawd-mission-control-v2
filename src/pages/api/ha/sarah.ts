import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

const ENTITY_IDS = {
  tracker: 'device_tracker.sarah_s_iphone2',
  geocoded: 'sensor.sarah_s_iphone2_geocoded_location',
};

async function getState(entityId: string) {
  if (!HA_URL || !HA_TOKEN) return null;
  try {
    const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
      headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!HA_URL || !HA_TOKEN) return res.status(500).json({ error: 'Missing HA_URL or HA_TOKEN' });

  const [tracker, geocoded] = await Promise.all([
    getState(ENTITY_IDS.tracker),
    getState(ENTITY_IDS.geocoded),
  ]);

  const trackerState = String(tracker?.state || '').toLowerCase();
  const isHome = trackerState === 'home' || trackerState === 'house';

  return res.status(200).json({
    person: 'Sarah',
    isHome,
    status: isHome ? 'home' : tracker?.state || 'unknown',
    location: geocoded?.state || 'Unknown location',
    entities: ENTITY_IDS,
    lastUpdated: new Date().toISOString(),
  });
}
