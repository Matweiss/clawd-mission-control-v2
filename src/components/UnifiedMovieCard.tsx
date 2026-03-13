import React, { useEffect, useState } from 'react';
import { Film, Star, Clock, RefreshCw, MapPin, Plus, Check, Eye, Trash2, ExternalLink, Clapperboard, Ticket, CalendarDays, ListTodo, RotateCcw } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  showtimes?: string[];
  theater?: 'tmdb' | 'regal';
}

interface MovieEntry extends Movie {
  addedAt: string;
  userRating?: number;
  notes?: string;
  theater: 'tmdb' | 'regal';
}

interface WatchlistData {
  watchlist: MovieEntry[];
  seenList: MovieEntry[];
  watchlistCount: number;
  seenCount: number;
}

interface MovieData {
  theater: string;
  location: { lat: number; lon: number };
  movies: Movie[];
  count: number;
  lastUpdated: string;
}

// Regal Unlimited Tracker Data
interface TrackerData {
  seenThisMonth: number;
  seenThisYear: number;
  monthlyCost: number;
  nextBilling: string;
}

export function UnifiedMovieCard() {
  const [data, setData] = useState<MovieData | null>(null);
  const [watchlistData, setWatchlistData] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'now-playing' | 'regal' | 'watchlist' | 'seen' | 'tracker'>('now-playing');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [trackerData, setTrackerData] = useState<TrackerData>({
    seenThisMonth: 4,
    seenThisYear: 11,
    monthlyCost: 26.95,
    nextBilling: 'Mar 15'
  });

  const fetchData = async () => {
    setLoading(true);
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
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (movie: Movie, theater: 'tmdb' | 'regal') => {
    try {
      const response = await fetch('/api/movies/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addToWatchlist', movie: { ...movie, theater } })
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
        // Update tracker
        setTrackerData(prev => ({
          ...prev,
          seenThisMonth: prev.seenThisMonth + 1,
          seenThisYear: prev.seenThisYear + 1
        }));
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

  const undoLastSeen = () => {
    if (watchlistData?.seenList && watchlistData.seenList.length > 0) {
      const lastSeen = watchlistData.seenList[watchlistData.seenList.length - 1];
      removeFromList(lastSeen, 'seen');
      setTrackerData(prev => ({
        ...prev,
        seenThisMonth: Math.max(0, prev.seenThisMonth - 1),
        seenThisYear: Math.max(0, prev.seenThisYear - 1)
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isInWatchlist = (movieId: number) =>
    watchlistData?.watchlist?.some(m => m.id === movieId) ?? false;

  const isInSeen = (movieId: number) =>
    watchlistData?.seenList?.some(m => m.id === movieId) ?? false;

  const costPerMovie = trackerData.monthlyCost / (trackerData.seenThisMonth || 1);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Movies</h2>
              <p className="text-xs text-gray-500">Regal Unlimited ${trackerData.monthlyCost}/mo • {trackerData.seenThisMonth} this month</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'now-playing', label: `Now Playing (${data?.count || 0})`, color: 'pink' },
            { id: 'regal', label: 'Regal Showtimes', color: 'red' },
            { id: 'watchlist', label: `Watchlist (${watchlistData?.watchlistCount || 0})`, color: 'blue' },
            { id: 'seen', label: `Seen (${watchlistData?.seenCount || 0})`, color: 'green' },
            { id: 'tracker', label: 'Tracker', color: 'rose' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeTab === tab.id
                  ? `bg-${tab.color}-500/20 text-${tab.color}-400`
                  : 'bg-surface-light text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
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
                <MovieRow
                  key={movie.id}
                  movie={movie}
                  isInWatchlist={isInWatchlist(movie.id)}
                  isInSeen={isInSeen(movie.id)}
                  onAddToWatchlist={() => addToWatchlist(movie, 'tmdb')}
                  onMarkAsSeen={() => setSelectedMovie(movie)}
                  poster_path={movie.poster_path}
                  vote_average={movie.vote_average}
                  release_date={movie.release_date}
                  overview={movie.overview}
                />
              ))
            )}
          </div>
        )}

        {/* Regal Showtimes Tab */}
        {activeTab === 'regal' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>Regal Sherman Oaks Galleria</span>
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

            <div className="text-center py-8 text-gray-500">
              <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Regal showtimes coming soon</p>
              <p className="text-xs text-gray-600 mt-1">Scraping Fandango/Google/Regal for live times</p>
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {!watchlistData?.watchlist.length ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Your watchlist is empty</p>
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

        {/* Tracker Tab */}
        {activeTab === 'tracker' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TrackerMetric
                icon={<Ticket className="w-4 h-4 text-rose-400" />}
                label="Seen This Month"
                value={String(trackerData.seenThisMonth)}
                sub={`≈ $${costPerMovie.toFixed(2)} / movie`}
              />
              <TrackerMetric
                icon={<Clapperboard className="w-4 h-4 text-pink-400" />}
                label="Seen This Year"
                value={String(trackerData.seenThisYear)}
                sub="Running yearly total"
              />
              <TrackerMetric
                icon={<CalendarDays className="w-4 h-4 text-orange-400" />}
                label="Next Billing"
                value={trackerData.nextBilling}
                sub="Recurring on the 15th"
              />
              <TrackerMetric
                icon={<ListTodo className="w-4 h-4 text-cyan-400" />}
                label="Watchlist"
                value={String(watchlistData?.watchlistCount || 0)}
                sub="Ready to watch"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab('now-playing')}
                className="flex items-center justify-center gap-1 rounded-lg bg-surface-light hover:bg-border transition-colors px-3 py-2 text-xs text-gray-300"
              >
                <Plus className="w-3 h-3" /> Add Seen
              </button>
              <button
                onClick={undoLastSeen}
                disabled={!watchlistData?.seenList.length}
                className="flex items-center justify-center gap-1 rounded-lg bg-surface-light hover:bg-border transition-colors px-3 py-2 text-xs text-gray-300 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" /> Undo
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className="flex items-center justify-center gap-1 rounded-lg bg-surface-light hover:bg-border transition-colors px-3 py-2 text-xs text-gray-300"
              >
                <ListTodo className="w-3 h-3" /> Watchlist
              </button>
            </div>
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

// Helper Components
function MovieRow({
  movie,
  isInWatchlist,
  isInSeen,
  onAddToWatchlist,
  onMarkAsSeen,
  poster_path,
  vote_average,
  release_date,
  overview
}: {
  movie: Movie;
  isInWatchlist: boolean;
  isInSeen: boolean;
  onAddToWatchlist: () => void;
  onMarkAsSeen: () => void;
  poster_path: string | null | undefined;
  vote_average: number | undefined;
  release_date: string | undefined;
  overview: string | undefined;
}) {
  return (
    <div className="flex gap-3 p-2 bg-surface-light rounded-lg group">
      {poster_path ? (
        <img src={poster_path} alt={movie.title} className="w-16 h-24 object-cover rounded" />
      ) : (
        <div className="w-16 h-24 bg-surface flex items-center justify-center rounded">
          <Film className="w-6 h-6 text-gray-600" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm truncate">{movie.title}</h3>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isInWatchlist && !isInSeen && (
              <button
                onClick={onAddToWatchlist}
                className="p-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                title="Add to watchlist"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onMarkAsSeen}
              className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
              title="Mark as seen"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {vote_average && (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <Star className="w-3 h-3 fill-current" />
              <span>{vote_average}</span>
            </div>
          )}
          {release_date && (
            <span className="text-xs text-gray-500">
              {new Date(release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {isInWatchlist && <span className="text-xs text-blue-400">• In Watchlist</span>}
          {isInSeen && <span className="text-xs text-green-400">• Seen</span>}
        </div>

        {overview && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{overview}</p>}
      </div>
    </div>
  );
}

function TrackerMetric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-surface-light p-3 border border-border/60">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}
