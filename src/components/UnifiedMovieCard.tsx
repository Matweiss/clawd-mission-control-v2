import React, { useState, useEffect } from 'react';
import { Film, Clock, TrendingUp, MapPin, RefreshCw, AlertCircle } from 'lucide-react';

interface Movie {
  title: string;
  showtimes: string[];
  format?: string;
}

interface DayOption {
  key: string;
  label: string;
  date: string;
  count: number;
}

interface MoviesResponse {
  theater: string;
  officialUrl: string;
  confidence: 'high' | 'medium' | 'low';
  freshness: string;
  days: DayOption[];
  movies: Movie[];
  lastUpdated: string;
  sourceNote?: string;
}

export function UnifiedMovieCard() {
  const [data, setData] = useState<MoviesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('thu');

  useEffect(() => {
    fetchMovies(selectedDay);
  }, [selectedDay]);

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

  const confidenceColor = data?.confidence === 'high' ? 'text-green-400' : data?.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400';

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
              {day.label}
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
            <span>{data?.sourceNote || 'Showtimes are browser-pulled and may need manual spot-checking on dense format pages.'}</span>
          </div>
        )}

        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {loading && <div className="text-sm text-gray-500">Loading showtimes…</div>}
          {!loading && data?.movies?.map((movie, idx) => (
            <div key={idx} className="p-3 bg-surface-light rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                  {movie.format && <p className="text-xs text-gray-500">{movie.format}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {movie.showtimes.map((time, sidx) => (
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

        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Operator notes</span>
          </div>
          <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10 text-xs text-gray-400">
            This panel now reads from structured schedule JSON instead of hardcoded movie data.
          </div>
        </div>
      </div>
    </div>
  );
}
