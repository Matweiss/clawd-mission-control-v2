import type { NextApiRequest, NextApiResponse } from 'next';

type RegalMovie = {
  title: string;
  format: string;
  showtimes: string[];
};

type DayBlock = {
  key: 'sun' | 'mon';
  label: string;
  date: string;
  movies: RegalMovie[];
};

const REGAL_DATA: {
  theater: string;
  officialUrl: string;
  source: string;
  days: DayBlock[];
  lastUpdated: string;
  sourceNote: string;
} = {
  theater: 'Regal Sherman Oaks Galleria',
  officialUrl: 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
  source: 'Regal Live Browser Tab',
  days: [
    {
      key: 'sun',
      label: 'Sun',
      date: '2026-03-15',
      movies: [
        { title: 'Hoppers', format: 'Mixed (4DX 3D / IMAX / RPX / Standard)', showtimes: ['10:00am', '10:30am', '12:00pm', '12:30pm', '1:15pm', '1:45pm', '3:00pm', '3:30pm', '4:10pm', '4:40pm', '5:10pm', '6:30pm', '7:15pm', '8:00pm', '9:30pm'] },
        { title: 'Scream 7', format: '4DX / RPX / Standard', showtimes: ['10:00am', '1:00pm', '4:00pm', '7:30pm', '8:00pm', '10:15pm', '11:00pm'] },
        { title: 'GOAT', format: 'Standard', showtimes: ['10:20am', '1:40pm', '4:50pm', '7:50pm', '10:10pm'] },
        { title: 'Reminders of Him', format: 'RPX + Standard', showtimes: ['10:30am', '11:00am', '11:30am', '1:00pm', '2:00pm', '2:30pm', '4:00pm', '5:00pm', '5:30pm', '7:00pm', '8:00pm', '8:30pm', '10:00pm', '11:00pm'] },
        { title: 'Slanted', format: 'Standard', showtimes: ['10:50am', '1:50pm', '4:30pm', '7:40pm', '10:30pm'] },
        { title: "Kiki's Delivery Service 4K", format: 'IMAX (JP sub)', showtimes: ['11:00am'] },
        { title: 'Wuthering Heights', format: 'Standard', showtimes: ['11:20am', '4:20pm', '6:20pm', '9:50pm'] },
        { title: 'Send Help', format: 'Standard', showtimes: ['11:40am', '2:50pm', '7:10pm', '10:50pm'] },
        { title: 'The Revenant (10th Anniversary)', format: 'Standard', showtimes: ['11:50am', '2:50pm', '6:40pm', '9:30pm'] },
        { title: 'The Bride!', format: 'IMAX + Standard', showtimes: ['12:00pm', '3:15pm', '6:50pm', '10:15pm', '11:00pm'] },
        { title: 'Undertone', format: 'RPX + Standard', showtimes: ['1:45pm', '4:40pm', '7:20pm', '10:10pm', '10:40pm'] },
        { title: 'Crime 101', format: 'Standard', showtimes: ['6:00pm', '10:20pm'] }
      ]
    },
    {
      key: 'mon',
      label: 'Mon',
      date: '2026-03-16',
      movies: [
        { title: 'Hoppers', format: 'Mixed (4DX 3D / IMAX / RPX / Standard)', showtimes: ['11:30am', '12:00pm', '12:30pm', '1:40pm', '2:15pm', '3:15pm', '3:45pm', '4:00pm', '4:40pm', '5:10pm', '6:15pm', '9:00pm'] },
        { title: 'Send Help', format: 'Standard', showtimes: ['11:40am', '3:05pm', '10:40pm'] },
        { title: 'The Bride!', format: 'IMAX + Standard', showtimes: ['11:45am', '3:10pm', '6:50pm', '10:00pm', '10:45pm'] },
        { title: 'Reminders of Him', format: 'RPX + Standard', showtimes: ['11:50am', '12:30pm', '1:15pm', '3:00pm', '3:30pm', '4:15pm', '6:00pm', '6:30pm', '7:15pm', '9:00pm', '9:30pm', '10:15pm'] },
        { title: 'Monday Mystery Movie (3/16)', format: 'Pre-order', showtimes: ['Mon Mar 16'] },
        { title: 'Project Hail Mary - Early Access', format: 'Pre-order', showtimes: ['Mon Mar 16'] }
      ]
    }
  ],
  lastUpdated: '2026-03-15T05:31:00Z',
  sourceNote: 'Pulled from live logged-in Regal tab. Sunday + Monday focused payload for Mission Control.'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dayParam = String(req.query.day || '').toLowerCase();
    const requestedDay = dayParam.startsWith('mon') ? 'mon' : 'sun';
    const activeDay = REGAL_DATA.days.find((d) => d.key === requestedDay) || REGAL_DATA.days[0];

    return res.status(200).json({
      theater: REGAL_DATA.theater,
      officialUrl: REGAL_DATA.officialUrl,
      source: REGAL_DATA.source,
      activeDay: activeDay.key,
      date: activeDay.date,
      days: REGAL_DATA.days.map((d) => ({ key: d.key, label: d.label, date: d.date, count: d.movies.length })),
      movies: activeDay.movies,
      count: activeDay.movies.length,
      lastUpdated: REGAL_DATA.lastUpdated,
      sourceNote: REGAL_DATA.sourceNote
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch showtimes', details: (error as Error).message });
  }
}
