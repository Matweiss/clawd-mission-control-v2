import React, { useEffect, useState } from 'react';
import { Film, Star, Clock, RefreshCw, MapPin, Plus, Check, Eye, Trash2 } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
}

interface MovieEntry extends Movie {
  addedAt: string;
  rating?: number;
  notes?: string;
}

interface MovieData {
  theater: string;
  location: { lat: number; lon: number };
  movies: Movie[];
  count: number;
  lastUpdated: string;
}

interface WatchlistData {
  watchlist: MovieEntry[];
  seenList: MovieEntry[];
  watchlistCount: number;
  seenCount: number;
}

export function MovieCard() {
  const [data, setData] = useState<MovieData | null>(null);
  const [watchlistData, setWatchlistData] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'now-playing' | 'watchlist' | 'seen'>('now-playing');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const [moviesRes, watchlistRes] = await Promise.all([
        fetch('/api/movies/showtimes'),
        fetch('/api/movies/watchlist')
      ]);

      if (moviesRes.ok) {
        const moviesData = await moviesRes.json();
        setData(moviesData);
      }

      if (watchlistRes.ok) {
        const watchData = await watchlistRes.json();
        setWatchlistData(watchData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (movie: Movie) => {
    try {
      const response = await fetch('/api/movies/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addToWatchlist', movie })
      });
      if (response.ok) {
        const result = await response.json();
        setWatchlistData(result);
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  };

  const markAsSeen = async (movie: Movie, userRating?: number, userNotes?: string) => {
    try {
      const response = await fetch('/api/movies/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'markAsSeen', 
          movie: { ...movie, rating: userRating, notes: userNotes }
        })
      });
      if (response.ok) {
        const result = await response.json();
        setWatchlistData(result);
        setSelectedMovie(null);
        setRating(0);
        setNotes('');
      }
    } catch (err) {
      console.error('Error marking as seen:', err);
    }
  };

  const removeFromList = async (movie: Movie, list: 'watchlist' | 'seen') => {
    try {
      const response = await fetch('/api/movies/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: list === 'watchlist' ? 'removeFromWatchlist' : 'removeFromSeen', 
          movie 
        })
      });
      if (response.ok) {
        const result = await response.json();
        setWatchlistData(result);
      }
    } catch (err) {
      console.error('Error removing from list:', err);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const isInWatchlist = (movieId: number) => 
    watchlistData?.watchlist.some(m => m.id === movieId);

  const isInSeen = (movieId: number) => 
    watchlistData?.seenList.some(m => m.id === movieId);

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
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-pink-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Movies</h2>
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

        {/* Tabs */}
        <div className="flex gap-2">
          {(['now-playing', 'watchlist', 'seen'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-pink-500/20 text-pink-400' 
                  : 'bg-surface-light text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'now-playing' && `Now Playing (${data?.count || 0})`}
              {tab === 'watchlist' && `Watchlist (${watchlistData?.watchlistCount || 0})`}
              {tab === 'seen' && `Seen (${watchlistData?.seenCount || 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Now Playing Tab */}
        {activeTab === 'now-playing' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {!data ? (
              <div className="text-center py-8 text-gray-500">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{loading ? 'Loading movies...' : 'No movie data'}</p>
              </div>
            ) : (
              data.movies.map((movie) => (
                <div key={movie.id} className="flex gap-3 p-2 bg-surface-light rounded-lg group">
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
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isInWatchlist(movie.id) && !isInSeen(movie.id) && (
                          <button
                            onClick={() => addToWatchlist(movie)}
                            className="p-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                            title="Add to watchlist"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMovie(movie)}
                          className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                          title="Mark as seen"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{movie.vote_average}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(movie.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {isInWatchlist(movie.id) && <span className="text-xs text-blue-400">• In Watchlist</span>}
                      {isInSeen(movie.id) && <span className="text-xs text-green-400">• Seen</span>}
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{movie.overview}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {!watchlistData?.watchlist.length ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Your watchlist is empty</p>
                <p className="text-xs text-gray-600 mt-1">Add movies from Now Playing</p>
              </div>
            ) : (
              watchlistData.watchlist.map((movie) => (
                <div key={movie.id} className="flex gap-3 p-2 bg-surface-light rounded-lg group">
                  {movie.poster_path ? (
                    <img src={movie.poster_path} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-24 bg-surface flex items-center justify-center rounded">
                      <Film className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedMovie(movie)}
                          className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                          title="Mark as seen"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromList(movie, 'watchlist')}
                          className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Added {new Date(movie.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Seen Tab */}
        {activeTab === 'seen' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {!watchlistData?.seenList.length ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No movies marked as seen yet</p>
              </div>
            ) : (
              watchlistData.seenList.map((movie) => (
                <div key={movie.id} className="flex gap-3 p-2 bg-surface-light rounded-lg group">
                  {movie.poster_path ? (
                    <img src={movie.poster_path} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-24 bg-surface flex items-center justify-center rounded">
                      <Film className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                      <button
                        onClick={() => removeFromList(movie, 'seen')}
                        className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {movie.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < movie.rating! ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    )}
                    
                    {movie.notes && <p className="text-xs text-gray-400 mt-1">{movie.notes}</p>}
                    
                    <p className="text-xs text-gray-500 mt-1">Watched {new Date(movie.addedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-medium text-lg mb-4">Mark as Seen: {selectedMovie.title}</h3>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star 
                      className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you think?"
                className="w-full px-3 py-2 bg-surface border border-border rounded text-sm resize-none"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => markAsSeen(selectedMovie, rating || undefined, notes || undefined)}
                className="flex-1 py-2 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setSelectedMovie(null);
                  setRating(0);
                  setNotes('');
                }}
                className="px-4 py-2 bg-surface border border-border rounded text-sm hover:bg-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
          <span>{activeTab === 'now-playing' ? data.count : activeTab === 'watchlist' ? watchlistData?.watchlistCount : watchlistData?.seenCount} movies</span>
          <span>Updated {new Date(data.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  );
}
