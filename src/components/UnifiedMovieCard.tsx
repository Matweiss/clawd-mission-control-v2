import React, { useState, useEffect } from 'react';
import { Film, Plus, Check, Clock, Star, TrendingUp, Calendar } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  year: string;
  rating?: string;
  duration?: string;
  genre?: string[];
  poster?: string;
  status: 'watchlist' | 'watched' | 'recommended';
  addedAt: string;
  recommendedReason?: string;
}

export function UnifiedMovieCard() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'schedule' | 'watchlist' | 'recommendations'>('schedule');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies/list');
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (movie: Omit<Movie, 'id' | 'status' | 'addedAt'>) => {
    try {
      const res = await fetch('/api/movies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...movie, status: 'watchlist' }),
      });
      if (res.ok) {
        fetchMovies();
      }
    } catch (err) {
      console.error('Failed to add movie:', err);
    }
  };

  const markAsWatched = async (id: string) => {
    try {
      const res = await fetch('/api/movies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'watched' }),
      });
      if (res.ok) {
        fetchMovies();
      }
    } catch (err) {
      console.error('Failed to update movie:', err);
    }
  };

  const watchlist = movies.filter(m => m.status === 'watchlist');
  const recommendations = movies.filter(m => m.status === 'recommended');
  const watched = movies.filter(m => m.status === 'watched');

  // Mock schedule for now - would come from calendar API
  const upcomingMovies = [
    { time: 'Tonight 8pm', title: 'Dune: Part Two', channel: 'HBO', type: 'premium' },
    { time: 'Tomorrow 9pm', title: 'The Bear S3', channel: 'FX', type: 'streaming' },
  ];

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-light rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Film className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Movies & Shows</h2>
              <p className="text-xs text-gray-500">{watchlist.length} in watchlist</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-4 pt-3">
        <div className="flex bg-surface-light rounded-lg p-1">
          {(['schedule', 'watchlist', 'recommendations'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === mode ? 'bg-surface text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {viewMode === 'schedule' && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-400 uppercase">Coming Up</h3>
              <button className="text-xs text-pink-400 hover:underline">View All</button>
            </div>
            
            {upcomingMovies.map((movie, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Film className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{movie.title}</p>
                  <p className="text-xs text-gray-500">{movie.time} • {movie.channel}</p>
                </div>
                <button
                  onClick={() => addToWatchlist({
                    title: movie.title,
                    year: '2024',
                    status: 'watchlist',
                    addedAt: new Date().toISOString(),
                  })}
                  className="p-2 hover:bg-pink-500/20 rounded-lg transition-colors"
                  title="Add to watchlist"
                >
                  <Plus className="w-4 h-4 text-pink-400" />
                </button>
              </div>
            ))}

            {recommendations.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1 mb-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">Recommended for you</span>
                </div>
                {recommendations.slice(0, 2).map((movie) => (
                  <div key={movie.id} className="flex items-center gap-2 p-2 bg-green-500/5 rounded-lg mb-1">
                    <Star className="w-3 h-3 text-green-400" />
                    <span className="text-sm">{movie.title}</span>
                    <span className="text-xs text-gray-500">• {movie.recommendedReason}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'watchlist' && (
          <>
            {watchlist.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No movies in watchlist</p>
                <p className="text-xs mt-1">Add from schedule or recommendations</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {watchlist.map((movie) => (
                  <div key={movie.id} className="flex items-center justify-between p-3 bg-surface-light rounded-lg">
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{movie.title}</p>
                        <p className="text-xs text-gray-500">{movie.year}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => markAsWatched(movie.id)}
                      className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                      title="Mark as watched"
                    >
                      <Check className="w-4 h-4 text-green-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'recommendations' && (
          <>
            <div className="flex items-center gap-1 mb-2">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">Based on your free time</span>
            </div>
            {recommendations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No recommendations yet</p>
                <p className="text-xs mt-1">Check back after calendar sync</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map((movie) => (
                  <div key={movie.id} className="p-3 bg-surface-light rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{movie.title}</span>
                      <span className="text-xs text-gray-500">{movie.duration}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{movie.recommendedReason}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToWatchlist(movie)}
                        className="flex-1 py-1.5 text-xs bg-pink-500/20 text-pink-400 rounded hover:bg-pink-500/30 transition-colors"
                      >
                        Add to Watchlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
