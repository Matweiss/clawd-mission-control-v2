import type { NextApiRequest, NextApiResponse } from 'next';
import { loadScheduleSnapshot, sortTimes } from '../../../lib/schedule-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const snapshot = loadScheduleSnapshot();
  if (!snapshot) {
    return res.status(500).json({ error: 'Schedule snapshot not found' });
  }

  const requestedKey = String(req.query.day || '').toLowerCase();
  const activeDay = snapshot.movies.days.find((d) => d.key === requestedKey) || snapshot.movies.days[0];

  return res.status(200).json({
    theater: snapshot.movies.theater,
    officialUrl: snapshot.sources.regal.url,
    source: snapshot.sources.regal.name,
    sourceType: snapshot.sources.regal.sourceType,
    confidence: snapshot.movies.confidence,
    freshness: snapshot.movies.freshness,
    activeDay: activeDay.key,
    date: activeDay.date,
    days: snapshot.movies.days.map((d) => ({
      key: d.key,
      label: d.label,
      date: d.date,
      count: d.movies.length,
    })),
    movies: activeDay.movies.map((movie) => ({
      title: movie.title,
      format: 'See theater page for exact format split',
      showtimes: sortTimes(movie.showtimes),
    })),
    count: activeDay.movies.length,
    lastUpdated: snapshot.movies.lastUpdated,
    sourceNote: snapshot.sources.regal.notes || 'Live browser extraction from Regal page',
  });
}
