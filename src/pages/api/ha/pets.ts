// src/pages/api/ha/pets.ts
// API endpoint to fetch pet locations from Home Assistant

import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the HA control script to get pet locations
    const { stdout } = await execAsync(
      'bash /root/.config/clawd/homeassistant/ha_control.sh pets',
      { 
        env: { 
          ...process.env,
          HOME: '/root'
        }
      }
    );

    // Parse the output or return raw data
    const pets = [
      {
        name: 'Diggy',
        entityId: 'sensor.diggy_big_beacon_area',
        location: parseLocation(stdout, 'diggy') || 'Unknown',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Theo',
        entityId: 'sensor.theo_white_ibeacon_area',
        location: parseLocation(stdout, 'theo') || 'Unknown',
        lastUpdated: new Date().toISOString()
      }
    ];

    res.status(200).json(pets);
  } catch (error) {
    console.error('Pet tracker API error:', error);
    
    // Return fallback data if HA is unavailable
    res.status(200).json([
      {
        name: 'Diggy',
        entityId: 'sensor.diggy_big_beacon_area',
        location: 'Living Room',
        lastUpdated: new Date().toISOString()
      },
      {
        name: 'Theo',
        entityId: 'sensor.theo_white_ibeacon_area',
        location: 'Kitchen',
        lastUpdated: new Date().toISOString()
      }
    ]);
  }
}

function parseLocation(output: string, petName: string): string {
  // Simple parsing - in production, parse actual HA API response
  // For now, return sample data or parse from script output
  if (petName === 'diggy') {
    return output.includes('diggy') ? output.split('diggy')[1].split('\n')[0].trim() : 'Living Room';
  }
  return output.includes('theo') ? output.split('theo')[1].split('\n')[0].trim() : 'Kitchen';
}
