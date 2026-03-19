import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Film, RefreshCw } from 'lucide-react';

type FormatGroup = { format: string; showtimes: string[] };
type Movie = { title: string; formats: FormatGroup[] };

type MoviesResponse = {
  confidence: 'high' | 'medium' | 'low';
  freshness: string;
  strict?: boolean;
  movies: Movie[];
  lastUpdated: string;
  sourceNote?: string | null;
};

type YogaStats = {
  confidence?: 'high' | 'medium' | 'low';
  freshness?: string;
  upcomingClasses: Array<{
    day: string;
    date: string;
    time: string;
    classType: string;
    teacher: string;
    location: string;
  }>;
  lastUpdated?: string;
};

function toDateTimeValue(date: string, time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  const base = new Date(`${date}T00:00:00`);
  if (!match || Number.isNaN(base.getTime())) return Number.MAX_SAFE_INTEGER;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toLowerCase();
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  base.setHours(hour, minute, 0, 0);
  return base.getTime();
}

export function TodayNeedsAttention() {
  const [movies, setMovies] = useState<MoviesResponse | null>(null);
  const [yoga, setYoga] = useState<YogaStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const [moviesRes, yogaRes] = await Promise.all([
        fetch('/api/movies/regal-sherman-oaks?day=thu'),
        fetch('/api/yoga/stats'),
      ]);
      if (moviesRes.ok) setMovies(await moviesRes.json());
      if (yogaRes.ok) setYoga(await yogaRes.json());
    } catch (error) {
      console.error('Failed to load today strip data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const nextYoga = useMemo(() => {
    if (!yoga?.upcomingClasses?.length) return null;
    return [...yoga.upcomingClasses].sort((a, b) => toDateTimeValue(a.date, a.time) - toDateTimeValue(b.date, b.time))[0];
  }, [yoga]);

  const tonightMovie = useMemo(() => {
    if (!movies?.movies?.length) return null;
    const candidates = movies.movies.flatMap((movie) =>
      movie.formats.flatMap((format) =>
        format.showtimes.map((time) => ({ title: movie.title, format: format.format, time }))
      )
    );
    return candidates[0] || null;
  }, [movies]);

  const needsAttention = useMemo(() => {
    const items: string[] = [];
    if (movies && !movies.strict) items.push('Movie data is provisional for some days');
    if (movies && movies.confidence !== 'high') items.push('Movie confidence is below high');
    if (yoga && yoga.freshness !== 'fresh') items.push('Yoga freshness is not fresh');
    if (!nextYoga) items.push('No upcoming yoga classes loaded');
    return items;
  }, [movies, yoga, nextYoga]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Today / Needs Attention</h2>
          <p className="text-xs text-gray-500">High-signal snapshot from live schedule data</p>
        </div>
        <button onClick={refresh} className="text-xs text-gray-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading summary…</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-surface-light p-3 border border-border">
            <div className="flex items-center gap-2 mb-2 text-orange-300 text-xs font-medium uppercase tracking-wide">
              <CalendarClock className="w-4 h-4" />
              Next Yoga
            </div>
            {nextYoga ? (
              <>
                <div className="text-sm font-medium text-white">{nextYoga.classType}</div>
                <div className="text-xs text-gray-400 mt-1">{nextYoga.day} • {nextYoga.time} • {nextYoga.location}</div>
                <div className="text-xs text-gray-500 mt-1">{nextYoga.teacher}</div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No upcoming class loaded</div>
            )}
          </div>

          <div className="rounded-lg bg-surface-light p-3 border border-border">
            <div className="flex items-center gap-2 mb-2 text-pink-300 text-xs font-medium uppercase tracking-wide">
              <Film className="w-4 h-4" />
              Movie Signal
            </div>
            {tonightMovie ? (
              <>
                <div className="text-sm font-medium text-white">{tonightMovie.title}</div>
                <div className="text-xs text-gray-400 mt-1">{tonightMovie.format} • {tonightMovie.time}</div>
                <div className={`text-xs mt-1 ${movies?.strict ? 'text-green-400' : 'text-yellow-400'}`}>
                  {movies?.strict ? 'Verified day' : 'Provisional day'}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No movie signal loaded</div>
            )}
          </div>

          <div className="rounded-lg bg-surface-light p-3 border border-border">
            <div className="flex items-center gap-2 mb-2 text-cyan-300 text-xs font-medium uppercase tracking-wide">
              {needsAttention.length ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              Needs Attention
            </div>
            {needsAttention.length ? (
              <ul className="space-y-1 text-xs text-gray-300">
                {needsAttention.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-green-400">No immediate issues detected</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
