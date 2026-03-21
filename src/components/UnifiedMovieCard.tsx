import React, { useEffect, useState } from 'react';
import { AlertCircle, Film, MapPin, RefreshCw, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react';

interface FormatGroup {
  format: string;
  showtimes: string[];
}

interface Movie {
  title: string;
  masterMovieCode?: string | null;
  formats: FormatGroup[];
}

interface DayOption {
  key: string;
  label: string;
  date: string;
  count: number;
  strict?: boolean;
}

interface MoviesResponse {
  theater: string;
  officialUrl: string;
  confidence: 'high' | 'medium' | 'low';
  freshness: string;
  strict?: boolean;
  schemaVersion?: number;
  days: DayOption[];
  movies: Movie[];
  lastUpdated: string;
  sourceNote?: string;
}

function getTodayKeyPT() {
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' })
    .format(new Date())
    .toLowerCase();
  return parts.slice(0, 3);
}

export function UnifiedMovieCard() {
  const [data, setData] = useState<MoviesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayKeyPT());

  useEffect(() => {
    fetchMovies(selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    if (!data?.days?.length) return;
    const exists = data.days.some((d) => d.key === selectedDay);
    if (!exists) setSelectedDay(data.days[0].key);
  }, [data, selectedDay]);

  const fetchMovies = async (day: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/movies/regal-sherman-oaks?day=${day}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch movies', err);
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor =
    data?.confidence === 'high'
      ? 'text-green-400'
      : data?.confidence === 'medium'
        ? 'text-yellow-400'
        : 'text-red-400';

  const strictBadge = data?.strict ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-300">
      <ShieldCheck className="h-3 w-3" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
      <ShieldAlert className="h-3 w-3" /> Provisional
    </span>
  );

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Film className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Regal Movies</h2>
              <p className="text-xs text-gray-500">Sherman Oaks Galleria</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchMovies(selectedDay)} className="text-xs text-gray-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open(data?.officialUrl || 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483', '_blank')}
              className="text-xs text-pink-400 hover:underline"
            >
              Book
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data && (
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-3">
              <span className={confidenceColor}>Confidence: {data.confidence}</span>
              <span>Freshness: {data.freshness}</span>
              {strictBadge}
            </div>
            <span>Updated {new Date(data.lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        )}

        <div className="flex bg-surface-light rounded-lg p-1">
          {(data?.days || []).map((day) => (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedDay === day.key ? 'bg-surface text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="flex flex-col items-center leading-tight">
                <span>{day.label}</span>
                <span className={`text-[10px] ${day.strict ? 'text-green-400' : 'text-yellow-400'}`}>{day.strict ? 'verified' : 'provisional'}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>{data?.theater || 'Regal Sherman Oaks Galleria'}</span>
        </div>

        {data?.confidence !== 'high' && (
          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300 flex items-start gap-2">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{data?.strict ? 'This day is fully verified from Regal’s structured page data.' : (data?.sourceNote || 'No strict Regal parse is available for this day yet.')}</span>
          </div>
        )}

        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {loading && <div className="text-sm text-gray-500">Loading showtimes…</div>}
          {!loading && !data?.movies?.length && (
            <div className="rounded-lg border border-border bg-surface-light p-4 text-sm text-gray-400">
              {data?.strict
                ? 'No strict movie rows were returned for this day.'
                : 'Strict Regal parsing is not complete for this day yet, so legacy mixed showtimes are intentionally hidden instead of shown inaccurately.'}
            </div>
          )}
          {!loading && data?.movies?.map((movie, idx) => (
            <div key={idx} className="p-3 bg-surface-light rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                  <p className="text-[11px] text-gray-500">
                    {movie.masterMovieCode ? `Movie ID: ${movie.masterMovieCode}` : 'No stable movie id'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {movie.formats.map((formatGroup, fidx) => (
                  <div key={fidx} className="rounded-lg border border-border/60 bg-surface/60 p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-pink-300">
                        {formatGroup.format}
                      </span>
                      <span className="text-[10px] text-gray-500">{formatGroup.showtimes.length} showtimes</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formatGroup.showtimes.map((time, sidx) => (
                        <button
                          key={sidx}
                          onClick={() => window.open(data?.officialUrl || 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483', '_blank')}
                          className="text-xs px-2 py-1 rounded bg-surface text-gray-300 border border-border hover:border-gray-500"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Operator notes</span>
          </div>
          <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10 text-xs text-gray-400">
            This panel now reads from strict structured schedule JSON when available, including format-separated Regal showtimes.
          </div>
        </div>
      </div>
    </div>
  );
}
