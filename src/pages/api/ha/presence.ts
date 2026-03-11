import type { NextApiRequest, NextApiResponse } from 'next';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

const ENTITY_IDS = {
  iphoneTracker: 'device_tracker.mat_s_iphone',
  iphoneBattery: 'sensor.mat_s_iphone_battery_level',
  iphoneBatteryState: 'sensor.mat_s_iphone_battery_state',
  iphoneGeocodedLocation: 'sensor.mat_s_iphone_geocoded_location',
  iphoneFocus: 'binary_sensor.mat_s_iphone_focus',
  iphoneSteps: 'sensor.mat_s_iphone_steps',
  watchBattery: 'sensor.mat_s_iphone_watch_battery',
  watchBatteryState: 'sensor.mat_s_iphone_watch_battery_state',
};

async function getEntityState(entityId: string) {
  if (!HA_URL || !HA_TOKEN) return null;

  const response = await fetch(`${HA_URL}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function normalizeBattery(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSteps(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value.replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function batteryStateLabel(value?: string): string {
  if (!value) return 'Unknown';
  const normalized = value.toLowerCase();
  if (normalized.includes('charging') || normalized.includes('full')) return 'Charging';
  if (normalized.includes('not charging')) return 'Not charging';
  return value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HA_URL || !HA_TOKEN) {
    return res.status(500).json({ error: 'Missing HA_URL or HA_TOKEN' });
  }

  try {
    const [
      iphoneTracker,
      iphoneBattery,
      iphoneBatteryState,
      iphoneGeocodedLocation,
      iphoneFocus,
      iphoneSteps,
      watchBattery,
      watchBatteryState,
    ] = await Promise.all([
      getEntityState(ENTITY_IDS.iphoneTracker),
      getEntityState(ENTITY_IDS.iphoneBattery),
      getEntityState(ENTITY_IDS.iphoneBatteryState),
      getEntityState(ENTITY_IDS.iphoneGeocodedLocation),
      getEntityState(ENTITY_IDS.iphoneFocus),
      getEntityState(ENTITY_IDS.iphoneSteps),
      getEntityState(ENTITY_IDS.watchBattery),
      getEntityState(ENTITY_IDS.watchBatteryState),
    ]);

    return res.status(200).json({
      status: 'live',
      source: 'Home Assistant',
      lastUpdated: new Date().toISOString(),
      iphoneBattery: normalizeBattery(iphoneBattery?.state) ?? 0,
      iphoneCharging: /charging|full/i.test(iphoneBatteryState?.state || ''),
      iphoneBatteryLabel: batteryStateLabel(iphoneBatteryState?.state),
      zone: iphoneTracker?.state || 'unknown',
      geocodedLocation: iphoneGeocodedLocation?.state || 'Unknown location',
      focusMode: iphoneFocus?.state === 'on' ? 'Focus On' : 'Focus Off',
      steps: normalizeSteps(iphoneSteps?.state) ?? 0,
      watchBattery: normalizeBattery(watchBattery?.state) ?? 0,
      watchCharging: /charging|full/i.test(watchBatteryState?.state || ''),
      watchBatteryLabel: batteryStateLabel(watchBatteryState?.state),
      entities: ENTITY_IDS,
    });
  } catch (error) {
    console.error('HA presence API error:', error);
    return res.status(500).json({ error: 'Failed to fetch Home Assistant presence data' });
  }
}
