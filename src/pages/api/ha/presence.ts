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
  iphoneAudioOutput: 'sensor.mat_s_iphone_audio_output',
  iphoneWifi: 'sensor.mat_s_iphone_ssid',
  watchArea: 'sensor.mat_s_ultra_watch_area',
  denDoorLock: 'lock.den_door',
  frontDoorLock: 'lock.front_door_2',
  livingRoomDoorLock: 'lock.living_room_3',
  hallwayLock: 'lock.hallway_lock',
  dogDoorLock: 'lock.d017695baf16',
  smartGarageDoor: 'cover.smart_garage_door_2111034444328436105448e1e97b5dfe_garage',
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
  const normalized = value.toLowerCase().trim();
  // Check "not charging" first to avoid matching it as "charging"
  if (normalized === 'not charging' || normalized.includes('not')) return 'Not charging';
  if (normalized === 'charging' || normalized === 'full' || normalized.includes('charging')) return 'Charging';
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

function lockStatusCategory(state?: string) {
  const normalized = state?.toLowerCase();
  if (normalized === 'locked') return 'locked';
  if (normalized === 'unlocked') return 'unlocked';
  return 'unknown_or_unavailable';
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
    iphoneAudioOutput,
    iphoneWifi,
    watchArea,
    denDoorLock,
    frontDoorLock,
    livingRoomDoorLock,
    hallwayLock,
    dogDoorLock,
    smartGarageDoor,
  ] = await Promise.all([
    getEntityState(ENTITY_IDS.iphoneTracker),
    getEntityState(ENTITY_IDS.iphoneBattery),
    getEntityState(ENTITY_IDS.iphoneBatteryState),
    getEntityState(ENTITY_IDS.iphoneGeocodedLocation),
    getEntityState(ENTITY_IDS.iphoneFocus),
    getEntityState(ENTITY_IDS.iphoneSteps),
    getEntityState(ENTITY_IDS.iphoneAudioOutput),
    getEntityState(ENTITY_IDS.iphoneWifi),
    getEntityState(ENTITY_IDS.watchArea),
    getEntityState(ENTITY_IDS.denDoorLock),
    getEntityState(ENTITY_IDS.frontDoorLock),
    getEntityState(ENTITY_IDS.livingRoomDoorLock),
    getEntityState(ENTITY_IDS.hallwayLock),
    getEntityState(ENTITY_IDS.dogDoorLock),
    getEntityState(ENTITY_IDS.smartGarageDoor),
  ]);

  const zone = normalizeZone(iphoneTracker?.state || iphoneGeocodedLocation?.state || 'unknown');
  // "home" or "house" both mean you're home
  const trackerState = (iphoneTracker?.state || '').toLowerCase();
  const away = trackerState !== 'home' && trackerState !== 'house';

  const locks = [
    { name: 'Den Door', state: lockLabel(denDoorLock?.state), entityId: ENTITY_IDS.denDoorLock },
    { name: 'Front Door', state: lockLabel(frontDoorLock?.state), entityId: ENTITY_IDS.frontDoorLock },
    { name: 'Living Room Door', state: lockLabel(livingRoomDoorLock?.state), entityId: ENTITY_IDS.livingRoomDoorLock },
    { name: 'Hallway Lock', state: lockLabel(hallwayLock?.state), entityId: ENTITY_IDS.hallwayLock },
    { name: 'Dog Door', state: lockLabel(dogDoorLock?.state), entityId: ENTITY_IDS.dogDoorLock },
  ].map(lock => ({
    ...lock,
    statusCategory: lockStatusCategory(lock.state),
  }));

  const unlocked = locks.filter(lock => lock.statusCategory === 'unlocked');
  const unknownOrUnavailable = locks.filter(lock => lock.statusCategory === 'unknown_or_unavailable');
  const availableFields = {
    iphoneBattery: !!iphoneBattery,
    iphonePower: !!iphoneBatteryState,
    zone: !!iphoneTracker,
    geocodedLocation: !!iphoneGeocodedLocation,
    focus: !!iphoneFocus,
    steps: !!iphoneSteps,
    audioOutput: !!iphoneAudioOutput,
    wifi: !!iphoneWifi,
    watchArea: !!watchArea,
    denDoor: !!denDoorLock,
    frontDoor: !!frontDoorLock,
    livingRoomDoor: !!livingRoomDoorLock,
    hallwayLock: !!hallwayLock,
    dogDoor: !!dogDoorLock,
    smartGarageDoor: !!smartGarageDoor,
  };

  const liveCount = Object.values(availableFields).filter(Boolean).length;
  const status = liveCount >= 7 ? 'live' : liveCount >= 4 ? 'stale' : 'disconnected';

  return res.status(200).json({
    status,
    source: 'Home Assistant',
    lastUpdated: new Date().toISOString(),
    iphoneBattery: normalizeBattery(iphoneBattery?.state) ?? 0,
    iphoneCharging: batteryStateLabel(iphoneBatteryState?.state) === 'Charging',
    iphoneBatteryLabel: batteryStateLabel(iphoneBatteryState?.state),
    zone,
    geocodedLocation: iphoneGeocodedLocation?.state || 'Unknown location',
    away,
    focusMode: normalizeFocus(iphoneFocus?.state),
    steps: normalizeSteps(iphoneSteps?.state) ?? 0,
    watchArea: watchArea?.state || 'Unknown',
    audioOutput: iphoneAudioOutput?.state || 'Unknown',
    wifi: iphoneWifi?.state || 'Unknown',
    // Inferred state: not on WiFi but connected to Bluetooth audio = likely driving
    likelyDriving: (iphoneWifi?.state === 'Unknown' || iphoneWifi?.state === 'Not Connected') && 
                   (iphoneAudioOutput?.state && iphoneAudioOutput?.state !== 'iPhone' && iphoneAudioOutput?.state !== 'Unknown'),
    locks,
    garageDoor: {
      name: 'Smart Garage Door',
      state: smartGarageDoor?.state || 'Unknown',
      entityId: ENTITY_IDS.smartGarageDoor,
    },
    unlockedLocks: unlocked,
    unknownOrUnavailableLocks: unknownOrUnavailable,
    allDoorsLocked: unlocked.length === 0,
    entities: ENTITY_IDS,
    availableFields,
  });
}
