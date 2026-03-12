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
  watchArea: 'sensor.mat_s_ultra_watch_area',
  frontDoorLock: 'lock.front_door',
  backDoorLock: 'lock.back_door',
  dogDoorLock: 'lock.d017695baf16',
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

function normalizeBattery(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value.replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSteps(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function batteryStateLabel(value?: string): string {
  if (!value) return 'Unknown';
  const normalized = value.toLowerCase();
  if (normalized.includes('charging') || normalized.includes('full')) return 'Charging';
  if (normalized.includes('not charging')) return 'Not charging';
  return value;
}

function normalizeFocus(value?: string) {
  if (!value) return 'Unknown';
  if (value.toLowerCase() === 'off') return 'Off';
  if (value.toLowerCase() === 'on') return 'On';
  return value;
}

function normalizeZone(value?: string) {
  if (!value) return 'unknown';
  return value.replace(/_/g, ' ');
}

function lockLabel(state?: string) {
  if (!state) return 'Unknown';
  if (state.toLowerCase() === 'locked') return 'Locked';
  if (state.toLowerCase() === 'unlocked') return 'Unlocked';
  return state;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!HA_URL || !HA_TOKEN) {
    return res.status(500).json({ error: 'Missing HA_URL or HA_TOKEN' });
  }

  const [
    iphoneTracker,
    iphoneBattery,
    iphoneBatteryState,
    iphoneGeocodedLocation,
    iphoneFocus,
    iphoneSteps,
    watchArea,
    frontDoorLock,
    backDoorLock,
    dogDoorLock,
  ] = await Promise.all([
    getEntityState(ENTITY_IDS.iphoneTracker),
    getEntityState(ENTITY_IDS.iphoneBattery),
    getEntityState(ENTITY_IDS.iphoneBatteryState),
    getEntityState(ENTITY_IDS.iphoneGeocodedLocation),
    getEntityState(ENTITY_IDS.iphoneFocus),
    getEntityState(ENTITY_IDS.iphoneSteps),
    getEntityState(ENTITY_IDS.watchArea),
    getEntityState(ENTITY_IDS.frontDoorLock),
    getEntityState(ENTITY_IDS.backDoorLock),
    getEntityState(ENTITY_IDS.dogDoorLock),
  ]);

  const zone = normalizeZone(iphoneTracker?.state || iphoneGeocodedLocation?.state || 'unknown');
  const away = !['home', 'sherman oaks', 'unknown', 'not_home'].includes(zone.toLowerCase())
    ? false
    : (iphoneTracker?.state || '').toLowerCase() === 'not_home';

  const locks = [
    { name: 'Front Door', state: lockLabel(frontDoorLock?.state), entityId: ENTITY_IDS.frontDoorLock },
    { name: 'Back Door', state: lockLabel(backDoorLock?.state), entityId: ENTITY_IDS.backDoorLock },
    { name: 'Dog Door', state: lockLabel(dogDoorLock?.state), entityId: ENTITY_IDS.dogDoorLock },
  ];

  const unlocked = locks.filter(lock => lock.state.toLowerCase() !== 'locked');
  const availableFields = {
    iphoneBattery: !!iphoneBattery,
    iphonePower: !!iphoneBatteryState,
    zone: !!iphoneTracker,
    geocodedLocation: !!iphoneGeocodedLocation,
    focus: !!iphoneFocus,
    steps: !!iphoneSteps,
    watchArea: !!watchArea,
    frontDoor: !!frontDoorLock,
    backDoor: !!backDoorLock,
    dogDoor: !!dogDoorLock,
  };

  const liveCount = Object.values(availableFields).filter(Boolean).length;
  const status = liveCount >= 7 ? 'live' : liveCount >= 4 ? 'stale' : 'disconnected';

  return res.status(200).json({
    status,
    source: 'Home Assistant',
    lastUpdated: new Date().toISOString(),
    iphoneBattery: normalizeBattery(iphoneBattery?.state) ?? 0,
    iphoneCharging: /charging|full/i.test(iphoneBatteryState?.state || ''),
    iphoneBatteryLabel: batteryStateLabel(iphoneBatteryState?.state),
    zone,
    geocodedLocation: iphoneGeocodedLocation?.state || 'Unknown location',
    away,
    focusMode: normalizeFocus(iphoneFocus?.state),
    steps: normalizeSteps(iphoneSteps?.state) ?? 0,
    watchArea: watchArea?.state || 'Unknown',
    locks,
    unlockedLocks: unlocked,
    allDoorsLocked: unlocked.length === 0,
    entities: ENTITY_IDS,
    availableFields,
  });
}
