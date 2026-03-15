import React, { useEffect, useState } from 'react';
import { Film, Clock, MapPin, ExternalLink, Star, Plus, Check } from 'lucide-react';

interface Movie {
  title: string;
  format: string;
  showtimes: string[];
}

export function MobileMoviesTab() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeDay, setActiveDay] = useState<'sun' | 'mon'>('sun');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async (day: 'sun' | 'mon' = activeDay) => {
    try {
      const response = await fetch(`/api/movies/regal-sherman-oaks?day=${day}`);
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
        if (data?.activeDay) setActiveDay(data.activeDay);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchlist = (title: string) => {
    setWatchlist(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Film className="w-8 h-8 text-gray-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Theater Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-400" />
          <span className="text-sm text-gray-400">Regal Sherman Oaks</span>
        </div>
        <a 
          href="https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-red-400"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="flex gap-2">
        {[{ key: 'sun', label: 'Sunday' }, { key: 'mon', label: 'Monday' }].map((day) => (
          <button
            key={day.key}
            onClick={() => {
              setActiveDay(day.key as 'sun' | 'mon');
              fetchMovies(day.key as 'sun' | 'mon');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium ${
              activeDay === day.key ? 'bg-rose-500 text-white' : 'bg-surface-light text-gray-400'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Movies List */}
      <div className="space-y-4">
        {movies.map((movie, index) => {
          const isInWatchlist = watchlist.includes(movie.title);
          
          return (
            <div key={index} className="bg-surface-light rounded-2xl p-4 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg leading-tight">{movie.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{movie.format}</p>
                </div>
                <button
                  onClick={() => toggleWatchlist(movie.title)}
                  className={`p-2 rounded-full transition-colors ${
                    isInWatchlist 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-surface text-gray-400'
                  }`}
                >
                  {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {/* Showtimes */}
              <div className="flex flex-wrap gap-2">
                {movie.showtimes.slice(0, 6).map((time, i) => (
                  <button
                    key={i}
                    className="px-3 py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {movies.length === 0 && (
        <div className="text-center py-20">
          <Film className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No showtimes available</p>
        </div>
      )}
    </div>
  );
}
