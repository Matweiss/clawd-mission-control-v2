import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, MapPin, Award, ChevronDown, ChevronUp, History } from 'lucide-react';

interface YogaClass {
  date: string;
  classType: string;
  teacher: string;
  time: string;
  location: string;
}

interface YogaStats {
  totalClasses: number;
  studioClasses: number;
  liveClasses: number;
  recentClasses: YogaClass[];
  buddyPasses: number;
  buddyPassExpiry: string;
  completedChallenge: string | null;
}

function getDaysSince(dateStr: string): number {
  const date = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split(' ');
  if (parts.length >= 2) {
    const month = monthNames.indexOf(parts[0]);
    const day = parseInt(parts[1]);
    if (month !== -1 && !isNaN(day)) {
      const classDate = new Date(date.getFullYear(), month, day);
      const diffMs = date.getTime() - classDate.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  }
  return 0;
}

function getDayName(dateStr: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split(' ');
  if (parts.length >= 2) {
    const month = monthNames.indexOf(parts[0]);
    const day = parseInt(parts[1]);
    if (month !== -1 && !isNaN(day)) {
      const date = new Date(new Date().getFullYear(), month, day);
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }
  return '';
}

export function YogaCard() {
  const [stats, setStats] = useState<YogaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'schedule' | 'history'>('schedule');

  useEffect(() => {
    fetchYogaData();
    const interval = setInterval(fetchYogaData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchYogaData = async () => {
    try {
      const res = await fetch('/api/yoga/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch yoga data:', err);
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExpiry = stats?.buddyPassExpiry
    ? Math.ceil((new Date(stats.buddyPassExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const lastClass = stats?.recentClasses[0];
  const daysSinceLastClass = lastClass ? getDaysSince(lastClass.date) : 0;

  // Generate upcoming week schedule
  const getUpcomingSchedule = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const schedule = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = days[date.getDay()];
      const dateNum = date.getDate();
      
      // Mat's typical pattern based on history
      const isTypicalDay = ['Sun', 'Mon', 'Tue', 'Thu', 'Fri'].includes(dayName);
      
      schedule.push({
        day: dayName,
        date: dateNum,
        isToday: i === 0,
        hasClass: isTypicalDay,
        suggestedTime: isTypicalDay ? '4:15pm' : null,
      });
    }
    return schedule;
  };

  const upcomingSchedule = getUpcomingSchedule();

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-light rounded w-1/3" />
          <div className="h-8 bg-surface-light rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-sm text-gray-500">Yoga data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">CorePower Yoga</h2>
              <p className="text-xs text-gray-500">All Access • {stats.totalClasses} classes</p>
            </div>
          </div>
          <button
            onClick={() => window.open('https://www.corepoweryoga.com', '_blank')}
            className="text-xs text-orange-400 hover:underline"
          >
            Open App
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* View Toggle */}
        <div className="flex bg-surface-light rounded-lg p-1">
          <button
            onClick={() => setViewMode('schedule')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'schedule' 
                ? 'bg-surface text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Schedule
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'history' 
                ? 'bg-surface text-white' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <History className="w-3 h-3" />
            History
          </button>
        </div>

        {viewMode === 'schedule' ? (
          <>
            {/* Last Class */}
            {lastClass && (
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-orange-400 uppercase tracking-wide">Last Class</span>
                  <span className={`text-xs font-medium ${daysSinceLastClass <= 1 ? 'text-green-400' : daysSinceLastClass <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {daysSinceLastClass === 0 ? 'Today' : daysSinceLastClass === 1 ? 'Yesterday' : `${daysSinceLastClass} days ago`}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{lastClass.classType}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastClass.time}
                  </span>
                  <span>•</span>
                  <span>{getDayName(lastClass.date)}, {lastClass.date}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {lastClass.location} with {lastClass.teacher}
                </div>
              </div>
            )}

            {/* Upcoming Schedule */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase">This Week</h3>
                <span className="text-xs text-gray-500">Suggested</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {upcomingSchedule.map((day, idx) => (
                  <div
                    key={idx}
                    className={`text-center p-2 rounded-lg ${
                      day.isToday 
                        ? 'bg-orange-500/20 border border-orange-500/30' 
                        : day.hasClass 
                          ? 'bg-surface-light' 
                          : 'bg-transparent'
                    }`}
                  >
                    <div className={`text-xs ${day.isToday ? 'text-orange-400 font-medium' : 'text-gray-500'}`}>
                      {day.day}
                    </div>
                    <div className={`text-sm font-medium ${day.isToday ? 'text-white' : 'text-gray-300'}`}>
                      {day.date}
                    </div>
                    {day.hasClass && day.suggestedTime && (
                      <div className="text-[10px] text-gray-500 mt-1">{day.suggestedTime}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.open('https://www.corepoweryoga.com/yoga-schedules', '_blank')}
                className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors"
              >
                Book Class
              </button>
              <button
                onClick={() => setViewMode('history')}
                className="px-4 py-2 bg-surface-light text-gray-400 rounded-lg text-sm hover:bg-border transition-colors"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-surface-light rounded-lg">
                <div className="text-xl font-bold text-orange-400">{stats.totalClasses}</div>
                <div className="text-[10px] text-gray-500">Total</div>
              </div>
              <div className="text-center p-2 bg-surface-light rounded-lg">
                <div className="text-xl font-bold text-blue-400">{stats.studioClasses}</div>
                <div className="text-[10px] text-gray-500">Studio</div>
              </div>
              <div className="text-center p-2 bg-surface-light rounded-lg">
                <div className="text-xl font-bold text-purple-400">{stats.liveClasses}</div>
                <div className="text-[10px] text-gray-500">Live</div>
              </div>
            </div>

            {/* Recent Classes */}
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Recent Classes</h3>
              <div className="space-y-1 max-h-[180px] overflow-y-auto">
                {stats.recentClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{cls.classType}</p>
                        <p className="text-xs text-gray-500">
                          {cls.teacher} • {cls.time}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{cls.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Buddy Pass Alert */}
        {stats.buddyPasses > 0 && (
          <div className={`p-3 rounded-lg ${daysUntilExpiry <= 14 ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${daysUntilExpiry <= 14 ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className="text-sm font-medium">
                  {stats.buddyPasses} Buddy Pass{stats.buddyPasses !== 1 ? 'es' : ''}
                </span>
              </div>
              <span className={`text-xs ${daysUntilExpiry <= 14 ? 'text-red-400 font-medium' : 'text-yellow-400'}`}>
                {daysUntilExpiry} days left
              </span>
            </div>
          </div>
        )}

        {/* Completed Challenge */}
        {stats.completedChallenge && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
            <Award className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">{stats.completedChallenge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
