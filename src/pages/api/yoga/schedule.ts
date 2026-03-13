import type { NextApiRequest, NextApiResponse } from 'next';

// CorePower Yoga schedule data
// Update by running: python3 scripts/scrape_corepower_yoga.py
// Last updated: 2026-03-13

// Classes Mat cares about
const PREFERRED_CLASSES = ['C2', 'C3', 'YS', 'CSX'];

const YOGA_DATA = {
  source: 'CorePower Yoga',
  date: '2026-03-13',
  studios: [
    {
      name: 'Sherman Oaks',
      url: 'https://www.corepoweryoga.com/yoga-schedules',
      classes: [
        { time: '6:00 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Aliza P', duration: '60 min', type: 'C2' },
        { time: '7:30 PM', name: 'YS - Yoga Sculpt', instructor: 'Bridget A', duration: '60 min', type: 'YS' },
        { time: '9:00 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Madison M', duration: '60 min', type: 'C2' }
      ]
    },
    {
      name: 'Encino',
      url: 'https://www.corepoweryoga.com/yoga-schedules',
      classes: [
        { time: '5:00 PM', name: 'C2 - CorePower Yoga 2', instructor: 'TBD', duration: '60 min', type: 'C2' },
        { time: '6:30 PM', name: 'YS - Yoga Sculpt', instructor: 'TBD', duration: '60 min', type: 'YS' }
      ]
    }
  ],
  classTypes: {
    C2: { name: 'CorePower Yoga 2', description: 'Intermediate heated yoga', level: 'Intermediate' },
    C3: { name: 'CorePower Yoga 3', description: 'Advanced heated yoga', level: 'Advanced' },
    YS: { name: 'Yoga Sculpt', description: 'Yoga + weights + cardio', level: 'All Levels' },
    CSX: { name: 'CorePower Strength X', description: 'Strength training', level: 'Intermediate' }
  },
  preferredClasses: PREFERRED_CLASSES,
  lastUpdated: '2026-03-13T20:00:00Z'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add counts
    const data = {
      ...YOGA_DATA,
      studios: YOGA_DATA.studios.map(studio => ({
        ...studio,
        count: studio.classes.length
      })),
      totalClasses: YOGA_DATA.studios.reduce((acc, s) => acc + s.classes.length, 0)
    };

    return res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch yoga schedule',
      details: (error as Error).message
    });
  }
}
