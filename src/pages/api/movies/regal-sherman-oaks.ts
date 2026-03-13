import type { NextApiRequest, NextApiResponse } from 'next';

// Static data from Fandango scrape - updated manually via local scraper
// Run: python3 scripts/showtimes_sherman_oaks_browserless.py
// Last updated: 2026-03-13

const REGAL_DATA = {
  theater: 'Regal Sherman Oaks Galleria',
  officialUrl: 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
  source: 'Fandango',
  date: '2026-03-13',
  movies: [
    {
      title: "Kiki's Delivery Service 4K (2026)",
      format: 'Standard',
      showtimes: ['2:15 PM']
    },
    {
      title: 'Reminders of Him (2026)',
      format: 'Standard',
      showtimes: ['10:30 AM', '11:00 AM', '11:30 AM', '1:00 PM', '2:00 PM', '2:30 PM', '4:00 PM', '5:00 PM', '5:30 PM', '7:00 PM', '8:00 PM', '8:30 PM', '10:00 PM', '11:00 PM']
    },
    {
      title: 'Slanted (2026)',
      format: 'Standard',
      showtimes: ['10:50 AM', '1:40 PM', '4:40 PM', '7:40 PM', '10:30 PM']
    },
    {
      title: 'Undertone (2026)',
      format: 'Standard',
      showtimes: ['1:45 PM', '4:30 PM', '7:20 PM', '10:10 PM', '10:40 PM']
    },
    {
      title: 'Hoppers (2026)',
      format: 'Standard',
      showtimes: ['10:30 AM', '12:00 PM', '12:30 PM', '1:15 PM', '1:45 PM', '3:00 PM', '3:30 PM', '4:10 PM', '4:40 PM', '5:10 PM', '6:30 PM', '7:15 PM', '8:00 PM', '9:30 PM']
    },
    {
      title: 'THE BRIDE! (2026)',
      format: 'Standard',
      showtimes: ['12:00 PM', '3:15 PM', '6:50 PM', '10:15 PM', '11:00 PM']
    },
    {
      title: 'The Revenant 10th Anniversary Re-Release (2026)',
      format: 'Standard',
      showtimes: ['11:50 AM', '2:50 PM', '6:40 PM', '9:40 PM']
    },
    {
      title: 'Crime 101 (2026)',
      format: 'Standard',
      showtimes: ['6:00 PM', '10:20 PM']
    },
    {
      title: 'GOAT (2026)',
      format: 'Standard',
      showtimes: ['1:40 PM', '4:50 PM', '7:50 PM', '10:10 PM']
    },
    {
      title: 'Wuthering Heights (2026)',
      format: 'Standard',
      showtimes: ['11:20 AM', '4:20 PM', '6:20 PM', '9:50 PM']
    },
    {
      title: 'Send Help (2026)',
      format: 'Standard',
      showtimes: ['11:40 AM', '2:50 PM', '7:10 PM', '10:50 PM']
    }
  ],
  lastUpdated: '2026-03-13T19:50:00Z'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      ...REGAL_DATA,
      count: REGAL_DATA.movies.length,
      cached: true,
      note: 'Data updated manually via local scraper. Run: python3 scripts/showtimes_sherman_oaks_browserless.py'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch showtimes',
      details: (error as Error).message
    });
  }
}
