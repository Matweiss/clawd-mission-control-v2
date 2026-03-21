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
  const isStrict = activeDay.strict ?? false;
  const strictMovies = activeDay.movies.map((movie) => ({
    title: movie.title,
    masterMovieCode: movie.masterMovieCode || null,
    formats: (movie.formats || []).map((formatGroup: any) => ({
      format: formatGroup.format,
      showtimes: sortTimes(formatGroup.showtimes || []),
    })),
  }));

  return res.status(200).json({
    theater: snapshot.movies.theater,
    officialUrl: snapshot.sources.regal.url,
    source: snapshot.sources.regal.name,
    sourceType: snapshot.sources.regal.sourceType,
    confidence: isStrict ? snapshot.movies.confidence : 'medium',
    freshness: snapshot.movies.freshness,
    activeDay: activeDay.key,
    date: activeDay.date,
    strict: isStrict,
    schemaVersion: snapshot.movies.schemaVersion || 1,
    days: snapshot.movies.days.map((d) => ({
      key: d.key,
      label: d.label,
      date: d.date,
      count: (d.strict ?? false) ? d.movies.length : 0,
      strict: d.strict ?? false,
    })),
    movies: strictMovies,
    count: strictMovies.length,
    lastUpdated: snapshot.movies.lastUpdated,
    sourceNote: isStrict
      ? snapshot.sources.regal.notes || 'Live browser extraction from Regal page'
      : `No strict Regal parse is available for ${activeDay.label} yet. Showing legacy fallback showtimes with provisional confidence.`,
  });
}
