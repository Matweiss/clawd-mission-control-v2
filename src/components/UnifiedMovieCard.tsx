import React, { useState, useEffect } from 'react';
import { Film, Plus, Check, Clock, Star, TrendingUp, Calendar, MapPin } from 'lucide-react';

interface MovieShowtime {
  time: string;
  format?: string;
}

interface Movie {
  title: string;
  runtime: string;
  showtimes: MovieShowtime[];
  day: string;
  date: string;
}

export function UnifiedMovieCard() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'schedule' | 'watchlist'>('schedule');
  const [selectedDay, setSelectedDay] = useState<'mon' | 'tue' | 'wed' | 'thu'>('mon');

  useEffect(() => {
    // Use scraped data from Regal
    const scrapedMovies: Movie[] = [
      // Monday 3/16
      { day: 'mon', date: 'Mar 16', title: 'Hoppers', runtime: '1h 45m', showtimes: [{ time: '4:00pm', format: 'IMAX' }, { time: '6:15pm' }, { time: '9:00pm' }] },
      { day: 'mon', date: 'Mar 16', title: 'The Bride!', runtime: '2h 6m', showtimes: [{ time: '6:50pm' }, { time: '10:00pm' }] },
      { day: 'mon', date: 'Mar 16', title: 'Reminders of Him', runtime: '1h 54m', showtimes: [{ time: '6:30pm' }, { time: '7:15pm' }, { time: '9:00pm' }, { time: '10:15pm' }] },
      { day: 'mon', date: 'Mar 16', title: 'Project Hail Mary', runtime: '2h 36m', showtimes: [{ time: '7:00pm', format: 'IMAX' }, { time: '7:30pm', format: 'RPX' }, { time: '8:00pm', format: '4DX' }] },
      { day: 'mon', date: 'Mar 16', title: 'Scream 7', runtime: '1h 54m', showtimes: [{ time: '8:00pm' }, { time: '11:00pm' }] },
      { day: 'mon', date: 'Mar 16', title: 'The Revenant (10th Anniversary)', runtime: '2h 36m', showtimes: [{ time: '6:40pm' }, { time: '10:15pm' }] },
      
      // Tuesday 3/17
      { day: 'tue', date: 'Mar 17', title: 'Hoppers', runtime: '1h 45m', showtimes: [{ time: '4:00pm', format: 'IMAX' }, { time: '6:15pm' }, { time: '9:00pm' }] },
      { day: 'tue', date: 'Mar 17', title: 'The Bride!', runtime: '2h 6m', showtimes: [{ time: '6:50pm' }, { time: '10:00pm' }] },
      { day: 'tue', date: 'Mar 17', title: 'Reminders of Him', runtime: '1h 54m', showtimes: [{ time: '6:30pm' }, { time: '7:15pm' }, { time: '9:00pm' }, { time: '10:15pm' }] },
      { day: 'tue', date: 'Mar 17', title: 'Ready or Not 2: Here I Come', runtime: '1h 48m', showtimes: [{ time: '8:00pm' }, { time: '11:00pm' }, { time: '7:30pm', format: 'RPX' }] },
      { day: 'tue', date: 'Mar 17', title: 'Project Hail Mary', runtime: '2h 36m', showtimes: [{ time: '5:30pm' }, { time: '9:15pm' }, { time: '6:00pm', format: 'RPX' }] },
      
      // Wednesday 3/18
      { day: 'wed', date: 'Mar 18', title: 'Hoppers', runtime: '1h 45m', showtimes: [{ time: '4:00pm', format: 'IMAX' }, { time: '6:15pm' }, { time: '9:00pm' }] },
      { day: 'wed', date: 'Mar 18', title: 'The Bride!', runtime: '2h 6m', showtimes: [{ time: '6:50pm' }, { time: '10:00pm' }] },
      { day: 'wed', date: 'Mar 18', title: 'Reminders of Him', runtime: '1h 54m', showtimes: [{ time: '6:30pm' }, { time: '7:15pm' }, { time: '9:00pm' }, { time: '10:15pm' }] },
      { day: 'wed', date: 'Mar 18', title: 'Ready or Not 2: Here I Come', runtime: '1h 48m', showtimes: [{ time: '8:00pm' }, { time: '11:00pm' }] },
      { day: 'wed', date: 'Mar 18', title: 'Project Hail Mary', runtime: '2h 36m', showtimes: [{ time: '5:30pm' }, { time: '9:15pm' }] },
      
      // Thursday 3/19
      { day: 'thu', date: 'Mar 19', title: 'Reminders of Him', runtime: '1h 54m', showtimes: [{ time: '7:15pm' }, { time: '10:15pm' }] },
      { day: 'thu', date: 'Mar 19', title: 'Ready or Not 2: Here I Come', runtime: '1h 48m', showtimes: [{ time: '8:00pm' }, { time: '11:00pm' }] },
      { day: 'thu', date: 'Mar 19', title: 'Project Hail Mary', runtime: '2h 36m', showtimes: [{ time: '5:30pm' }, { time: '7:00pm', format: 'IMAX' }, { time: '9:15pm' }] },
    ];
    
    setMovies(scrapedMovies);
    setLoading(false);
  }, []);

  const filteredMovies = movies.filter(m => m.day === selectedDay);

  const addToWatchlist = (movie: Movie) => {
    // In a real implementation, this would call the API
    alert(`Added "${movie.title}" to watchlist!`);
  };

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
              <h2 className="text-sm font-semibold text-white">Regal Movies</h2>
              <p className="text-xs text-gray-500">Sherman Oaks Galleria</p>
            </div>
          </div>
          <button
            onClick={() => window.open('https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483', '_blank')}
            className="text-xs text-pink-400 hover:underline"
          >
            Book
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Day Selector */}
        <div className="flex bg-surface-light rounded-lg p-1">
          {(['mon', 'tue', 'wed', 'thu'] as const).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedDay === day 
                  ? 'bg-surface text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </button>
          ))}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span>15301 Ventura Blvd, Sherman Oaks</span>
        </div>

        {/* Movie Schedule */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {filteredMovies.map((movie, idx) => (
            <div key={idx} className="p-3 bg-surface-light rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{movie.title}</h3>
                  <p className="text-xs text-gray-500">{movie.runtime}</p>
                </div>
                <button
                  onClick={() => addToWatchlist(movie)}
                  className="p-1.5 hover:bg-pink-500/20 rounded-lg transition-colors ml-2"
                  title="Add to watchlist"
                >
                  <Plus className="w-4 h-4 text-pink-400" />
                </button>
              </div>
              
              {/* Showtimes */}
              <div className="flex flex-wrap gap-1.5">
                {movie.showtimes.map((show, sidx) => (
                  <button
                    key={sidx}
                    onClick={() => window.open('https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483', '_blank')}
                    className={`text-xs px-2 py-1 rounded ${
                      show.format 
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                        : 'bg-surface text-gray-300 border border-border hover:border-gray-500'
                    }`}
                  >
                    {show.time}
                    {show.format && <span className="ml-1 text-[10px]">{show.format}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1 mb-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400">Perfect after yoga</span>
          </div>
          <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
            <p className="text-sm font-medium">Project Hail Mary</p>
            <p className="text-xs text-gray-500">7:00pm IMAX • 2h 36m</p>
            <p className="text-xs text-gray-600 mt-1">Gives you time for dinner after 4:30pm yoga</p>
          </div>
        </div>
      </div>
    </div>
  );
}
