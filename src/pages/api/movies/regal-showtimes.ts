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
    source: snapshot.sources.regal.name,
    sourceType: snapshot.sources.regal.sourceType,
    confidence: snapshot.movies.confidence,
    freshness: snapshot.movies.freshness,
    activeDay: activeDay.key,
    date: activeDay.date,
    strict: activeDay.strict ?? false,
    schemaVersion: snapshot.movies.schemaVersion || 1,
    days: snapshot.movies.days.map((day) => ({
      key: day.key,
      label: day.label,
      date: day.date,
      count: day.movies.length,
      strict: day.strict ?? false,
    })),
    movies: activeDay.movies.map((movie, idx) => ({
      id: idx + 1,
      title: movie.title,
      masterMovieCode: movie.masterMovieCode || null,
      poster_path: null,
      rating: null,
      formats: (movie.formats || []).map((formatGroup: any) => ({
        format: formatGroup.format,
        showtimes: sortTimes(formatGroup.showtimes || []),
      })),
    })),
    count: activeDay.movies.length,
    lastUpdated: snapshot.movies.lastUpdated,
    officialUrl: snapshot.sources.regal.url,
    notes: snapshot.sources.regal.notes || null,
  });
}
