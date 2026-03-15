import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

const ENTITIES = {
  sarahHome: 'device_tracker.sarah_s_iphone2',
  sarahLocation: 'sensor.sarah_s_iphone2_geocoded_location',
  feedTheoButton: 'button.theo_s_food_feed',
  lockItDownAutomation: 'automation.lock_it_down',
  frontDoor: 'lock.front_door_2',
  denDoor: 'lock.den_door',
  garageDoor: 'lock.garage_door',
  dogDoor: 'lock.dog_door',
};

type CommandAction =
  | 'where_is_sarah'
  | 'feed_theo'
  | 'lock_it_down'
  | 'lock_front_door'
  | 'lock_all_doors';

function detectAction(input?: string): CommandAction | null {
  if (!input) return null;
  const text = input.toLowerCase().trim();

  if (text.includes('where is sarah') || text.includes('is sarah home') || text.includes('sarah location')) {
    return 'where_is_sarah';
  }
  if (text.includes('feed theo')) return 'feed_theo';
  if (text.includes('lock it down')) return 'lock_it_down';
  if (text.includes('lock front door')) return 'lock_front_door';
  if (text.includes('lock all doors') || text.includes('lock all door')) return 'lock_all_doors';

  return null;
}

async function haState(entityId: string) {
  const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
    headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) return null;
  return response.json();
}

async function callService(domain: string, service: string, payload: Record<string, unknown>) {
  const response = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HA service ${domain}/${service} failed: ${response.status} ${errorText}`);
  }
  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HA_URL || !HA_TOKEN) {
    return res.status(500).json({ error: 'Missing HA_URL or HA_TOKEN' });
  }

  const command = String(req.body?.command || '');
  const action = (req.body?.action as CommandAction | undefined) || detectAction(command) || null;

  if (!action) {
    return res.status(400).json({
      error: 'Unknown command',
      supported: ['where is sarah', 'feed theo', 'lock it down', 'lock front door', 'lock all doors'],
    });
  }

  try {
    if (action === 'where_is_sarah') {
      const [homeState, locationState] = await Promise.all([
        haState(ENTITIES.sarahHome),
        haState(ENTITIES.sarahLocation),
      ]);

      const homeRaw = String(homeState?.state || '').toLowerCase();
      const isHome = homeRaw === 'home' || homeRaw === 'house';
      const location = String(locationState?.state || 'Unknown');

      return res.status(200).json({
        success: true,
        action,
        result: {
          isHome,
          status: isHome ? 'home' : 'away',
          location,
          entityIds: { home: ENTITIES.sarahHome, geocoded: ENTITIES.sarahLocation },
          message: isHome
            ? `Sarah is home (${location}).`
            : `Sarah is away. Current location: ${location}`,
        },
      });
    }

    if (action === 'feed_theo') {
      await callService('button', 'press', { entity_id: ENTITIES.feedTheoButton });
      return res.status(200).json({
        success: true,
        action,
        result: { entityId: ENTITIES.feedTheoButton, message: 'Theo feed button triggered.' },
      });
    }

    if (action === 'lock_it_down') {
      await callService('automation', 'trigger', { entity_id: ENTITIES.lockItDownAutomation });
      return res.status(200).json({
        success: true,
        action,
        result: { entityId: ENTITIES.lockItDownAutomation, message: 'Lock-it-down automation triggered.' },
      });
    }

    if (action === 'lock_front_door') {
      await callService('lock', 'lock', { entity_id: ENTITIES.frontDoor });
      return res.status(200).json({
        success: true,
        action,
        result: { entityId: ENTITIES.frontDoor, message: 'Front door lock command sent.' },
      });
    }

    if (action === 'lock_all_doors') {
      const targets = [ENTITIES.frontDoor, ENTITIES.denDoor, ENTITIES.garageDoor, ENTITIES.dogDoor];
      await Promise.all(targets.map((entity_id) => callService('lock', 'lock', { entity_id })));
      return res.status(200).json({
        success: true,
        action,
        result: { entityIds: targets, message: 'Lock command sent to all configured doors.' },
      });
    }

    return res.status(500).json({ error: 'Unhandled command action' });
  } catch (error) {
    console.error('HA command API error:', error);
    return res.status(500).json({ error: 'Failed to execute HA command', details: (error as Error).message });
  }
}
