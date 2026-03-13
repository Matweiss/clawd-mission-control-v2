import React, { useEffect, useState } from 'react';
import { Film, Star, Clock, RefreshCw, MapPin } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

interface MovieData {
  theater: string;
  location: { lat: number; lon: number };
  movies: Movie[];
  count: number;
  lastUpdated: string;
}

export function MovieCard() {
  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/movies/showtimes');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  if (error) {
    return (
      <div className="bg-surface border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <Film className="w-4 h-4" />
          <span className="text-sm font-medium">Movies Error</span>
        </div>
        <p className="text-xs text-gray-400">{error}</p>
        <button 
          onClick={fetchMovies}
          className="mt-2 text-xs bg-surface-light px-3 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-pink-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Now Playing</h2>
            {data && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{data.theater}</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={fetchMovies}
          className="p-1 hover:bg-surface-light rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4">
        {!data ? (
          <div className="text-center py-8 text-gray-500">
            <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{loading ? 'Loading movies...' : 'No movie data'}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {data.movies.map((movie) => (
              <div key={movie.id} className="flex gap-3 p-2 bg-surface-light rounded-lg">
                {movie.poster_path ? (
                  <img 
                    src={movie.poster_path} 
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-surface flex items-center justify-center rounded">
                    <Film className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{movie.vote_average}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(movie.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{movie.overview}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
          <span>{data.count} movies</span>
          <span>Updated {new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
}
