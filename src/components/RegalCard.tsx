import React, { useEffect, useState } from 'react';
import { Film, Star, Clock, MapPin, Plus, Check, Eye, Trash2, ExternalLink } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  showtimes: string[];
  rating?: string;
}

interface MovieEntry extends Movie {
  addedAt: string;
  userRating?: number;
  notes?: string;
}

interface WatchlistData {
  watchlist: MovieEntry[];
  seenList: MovieEntry[];
  watchlistCount: number;
  seenCount: number;
}

// Mock showtimes data - in production this would come from scraping or API
const REGAL_SHOWTIMES: Record<number, string[]> = {
  // Example movie IDs with showtimes
  // This would be populated by scraping Regal's website
};

export function RegalCard() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [watchlistData, setWatchlistData] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'showtimes' | 'watchlist' | 'seen'>('showtimes');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch watchlist/seen data (shared with MovieCard)
      const watchlistRes = await fetch('/api/movies/watchlist');
      if (watchlistRes.ok) {
        const data = await watchlistRes.json();
        setWatchlistData(data);
      }

      // Fetch Regal showtimes (would be from scraping in production)
      // For now, we'll use a placeholder that you'd replace with actual scraping
      const showtimesRes = await fetch('/api/movies/regal-showtimes');
      if (showtimesRes.ok) {
        const showData = await showtimesRes.json();
        setMovies(showData.movies || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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
    fetchData();
  }, []);

  const isInWatchlist = (movieId: number) => 
    watchlistData?.watchlist.some(m => m.id === movieId);

  const isInSeen = (movieId: number) => 
    watchlistData?.seenList.some(m => m.id === movieId);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-red-500" />
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Regal Sherman Oaks</h2>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>Galleria Showtimes</span>
              </div>
            </div>
          </div>
          <a
            href="https://www.regmovies.com/theatres/regal-sherman-oaks-galleria/0628"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400 hover:underline flex items-center gap-1"
          >
            Book
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['showtimes', 'watchlist', 'seen'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeTab === tab 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-surface-light text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'showtimes' && `Showtimes (${movies.length})`}
              {tab === 'watchlist' && `Watchlist (${watchlistData?.watchlistCount || 0})`}
              {tab === 'seen' && `Seen (${watchlistData?.seenCount || 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Showtimes Tab */}
        {activeTab === 'showtimes' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {movies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{loading ? 'Loading showtimes...' : 'Showtimes coming soon'}</p>
                <p className="text-xs text-gray-600 mt-2">Scraping Regal website for live showtimes</p>
              </div>
            ) : (
              movies.map((movie) => (
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
                    
                    {/* Showtimes */}
                    {movie.showtimes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.showtimes.map((time, i) => (
                          <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                            {time}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1">
                      {isInWatchlist(movie.id) && <span className="text-xs text-blue-400">• In Watchlist</span>}
                      {isInSeen(movie.id) && <span className="text-xs text-green-400">• Seen</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Watchlist Tab - Shared with MovieCard */}
        {activeTab === 'watchlist' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {!watchlistData?.watchlist.length ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Your watchlist is empty</p>
                <p className="text-xs text-gray-600 mt-1">Add from Showtimes or TMDB Now Playing</p>
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

        {/* Seen Tab - Shared with MovieCard */}
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
                    
                    {movie.userRating && (
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < movie.userRating! ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
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
    </div>
  );
}
