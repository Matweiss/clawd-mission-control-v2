import type { NextApiRequest, NextApiResponse } from 'next';

const REGAL_SHOWTIMES = {
  theater: 'Regal Sherman Oaks Galleria',
  source: 'Regal Live Browser Tab',
  days: {
    sun: [
      { id: 1001, title: 'Hoppers', poster_path: null, rating: 'PG', showtimes: ['10:00am', '10:30am', '12:00pm', '12:30pm', '1:15pm', '1:45pm', '3:00pm', '3:30pm', '4:10pm', '4:40pm', '5:10pm', '6:30pm', '7:15pm', '8:00pm', '9:30pm'] },
      { id: 1002, title: 'Scream 7', poster_path: null, rating: 'R', showtimes: ['10:00am', '1:00pm', '4:00pm', '7:30pm', '8:00pm', '10:15pm', '11:00pm'] },
      { id: 1003, title: 'GOAT', poster_path: null, rating: 'PG-13', showtimes: ['10:20am', '1:40pm', '4:50pm', '7:50pm', '10:10pm'] },
      { id: 1004, title: 'Reminders of Him', poster_path: null, rating: 'PG-13', showtimes: ['10:30am', '11:00am', '11:30am', '1:00pm', '2:00pm', '2:30pm', '4:00pm', '5:00pm', '5:30pm', '7:00pm', '8:00pm', '8:30pm', '10:00pm', '11:00pm'] },
      { id: 1005, title: 'The Bride!', poster_path: null, rating: 'R', showtimes: ['12:00pm', '3:15pm', '6:50pm', '10:15pm', '11:00pm'] }
    ],
    mon: [
      { id: 1101, title: 'Hoppers', poster_path: null, rating: 'PG', showtimes: ['11:30am', '12:00pm', '12:30pm', '1:40pm', '2:15pm', '3:15pm', '3:45pm', '4:00pm', '4:40pm', '5:10pm', '6:15pm', '9:00pm'] },
      { id: 1102, title: 'Send Help', poster_path: null, rating: 'R', showtimes: ['11:40am', '3:05pm', '10:40pm'] },
      { id: 1103, title: 'The Bride!', poster_path: null, rating: 'R', showtimes: ['11:45am', '3:10pm', '6:50pm', '10:00pm', '10:45pm'] },
      { id: 1104, title: 'Reminders of Him', poster_path: null, rating: 'PG-13', showtimes: ['11:50am', '12:30pm', '1:15pm', '3:00pm', '3:30pm', '4:15pm', '6:00pm', '6:30pm', '7:15pm', '9:00pm', '9:30pm', '10:15pm'] },
      { id: 1105, title: 'Monday Mystery Movie (3/16)', poster_path: null, rating: 'TBD', showtimes: ['Pre-order Mon Mar 16'] }
    ]
  },
  lastUpdated: '2026-03-15T05:31:00Z'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const dayParam = String(req.query.day || '').toLowerCase();
  const dayKey = dayParam.startsWith('mon') ? 'mon' : 'sun';
  const movies = REGAL_SHOWTIMES.days[dayKey as 'sun' | 'mon'];

  return res.status(200).json({
    theater: REGAL_SHOWTIMES.theater,
    source: REGAL_SHOWTIMES.source,
    activeDay: dayKey,
    days: [
      { key: 'sun', label: 'Sun', count: REGAL_SHOWTIMES.days.sun.length },
      { key: 'mon', label: 'Mon', count: REGAL_SHOWTIMES.days.mon.length }
    ],
    movies,
    count: movies.length,
    lastUpdated: REGAL_SHOWTIMES.lastUpdated
  });
}
