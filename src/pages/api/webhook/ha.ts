// src/pages/api/webhook/ha.ts
// Home Assistant webhook endpoint for location updates

import type { NextApiRequest, NextApiResponse } from 'next';

const HA_SECRET = process.env.HA_WEBHOOK_SECRET || 'your-secret-here';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify Home Assistant secret
  const authHeader = req.headers['x-ha-secret'];
  if (authHeader !== HA_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { location, zone, timestamp, mode } = req.body;

  // Update location status (store in memory, database, or state)
  updateLocationStatus({
    location,
    zone,
    timestamp,
    mode,
    source: 'home-assistant'
  });

  // Return success
  res.status(200).json({ 
    success: true,
    location,
    mode: getCurrentMode(),
    message: `Location updated: ${location}`
  });
}

// Store location state (in production, use database or Redis)
let currentLocation = {
  location: 'unknown',
  zone: 'unknown',
  mode: 'normal',
  lastUpdate: new Date().toISOString()
};

function updateLocationStatus(data: any) {
  currentLocation = {
    ...currentLocation,
    location: data.location || currentLocation.location,
    zone: data.zone || currentLocation.zone,
    mode: data.mode || determineMode(data.location, data.zone),
    lastUpdate: data.timestamp || new Date().toISOString()
  };

  console.log('📍 Location updated:', currentLocation);
  
  // Trigger mode-specific actions
  handleModeChange(currentLocation.mode);
}

function determineMode(location: string, zone: string): string {
  if (location === 'home') return 'home';
  if (location === 'driving' || location === 'moving') return 'driving';
  if (location === 'office' || zone === 'office') return 'work';
  if (location === 'away') return 'mobile';
  if (location === 'dnd' || location === 'event') return 'silent';
  return 'normal';
}

function handleModeChange(mode: string) {
  switch (mode) {
    case 'home':
      console.log('🏠 Home mode: Full dashboard, all notifications');
      break;
    case 'mobile':
      console.log('📱 Mobile mode: Brief notifications, mobile-optimized');
      break;
    case 'driving':
      console.log('🚗 Driving mode: Voice-only, queue non-urgent');
      break;
    case 'work':
      console.log('💼 Work mode: Professional, focused notifications');
      break;
    case 'silent':
      console.log('🔕 Silent mode: Emergency alerts only');
      break;
  }
}

function getCurrentMode() {
  return currentLocation.mode;
}

// Export for use in other components
export { currentLocation, getCurrentMode };
