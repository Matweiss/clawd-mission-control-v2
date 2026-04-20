import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock, MapPin, Award, History, BookOpen, RefreshCw } from 'lucide-react';

interface YogaClass {
  date: string;
  classType: string;
  teacher: string;
  time: string;
  location: string;
}

interface ScheduledClass extends YogaClass {
  day: string;
}

interface YogaStats {
  totalClasses: number;
  studioClasses: number;
  liveClasses: number;
  recentClasses: YogaClass[];
  upcomingClasses: ScheduledClass[];
  buddyPasses: number;
  buddyPassExpiry: string;
  completedChallenge: string | null;
  confidence?: 'high' | 'medium' | 'low';
  freshness?: string;
  lastUpdated?: string;
  sourceNote?: string | null;
  sourceError?: string | null;
}

function getDaysSince(dateStr: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diffMs = today.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function toDateTimeValue(date: string, time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  const base = new Date(`${date}T00:00:00`);
  if (!match || Number.isNaN(base.getTime())) return Number.MAX_SAFE_INTEGER;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toLowerCase();
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  base.setHours(hour, minute, 0, 0);
  return base.getTime();
}

function toMinutesOnly(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridiem = match[3].toLowerCase();
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return hour * 60 + minute;
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

  const confidenceColor = stats?.confidence === 'high' ? 'text-green-400' : stats?.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400';

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

  const recentClassesSorted = [...stats.recentClasses].sort((a, b) => toDateTimeValue(b.date, b.time) - toDateTimeValue(a.date, a.time));
  const upcomingClassesSorted = [...stats.upcomingClasses].sort((a, b) => {
    const dateDiff = new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime();
    if (dateDiff !== 0) return dateDiff;
    return toMinutesOnly(a.time) - toMinutesOnly(b.time);
  });
  const lastClass = recentClassesSorted[0];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
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
          <div className="flex items-center gap-3">
            <button onClick={fetchYogaData} className="text-xs text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            <button
              onClick={() => window.open('https://www.corepoweryoga.com/yoga-schedules/studio', '_blank')}
              className="text-xs text-orange-400 hover:underline"
            >
              Open App
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className={confidenceColor}>Confidence: {stats.confidence || 'medium'}</span>
            <span>Freshness: {stats.freshness || 'stale'}</span>
          </div>
          <span>{stats.lastUpdated ? `Updated ${new Date(stats.lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span>
        </div>

        {(stats.sourceError || stats.sourceNote) && (
          <div className={`rounded-lg border px-3 py-2 text-xs ${stats.sourceError ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-200'}`}>
            {stats.sourceError ? stats.sourceError : stats.sourceNote}
          </div>
        )}

        <div className="flex bg-surface-light rounded-lg p-1">
          <button
            onClick={() => setViewMode('schedule')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'schedule' ? 'bg-surface text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Schedule
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'history' ? 'bg-surface text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <History className="w-3 h-3" />
            History
          </button>
        </div>

        {viewMode === 'schedule' ? (
          <>
            {lastClass && (
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-orange-400 uppercase tracking-wide">Last Class</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{lastClass.classType}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {lastClass.time}
                  </span>
                  <span>•</span>
                  <span>{lastClass.date}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {lastClass.location} with {lastClass.teacher}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase">Up Next</h3>
                <span className="text-xs text-gray-500">Live schedule snapshot</span>
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {upcomingClassesSorted.slice(0, 10).map((cls, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-surface-light border-transparent">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-orange-400">{cls.day}</span>
                      <span className="text-xs text-gray-500">{cls.time}</span>
                    </div>
                    <h4 className="font-medium text-sm">{cls.classType}</h4>
                    <p className="text-xs text-gray-500">{cls.teacher} • {cls.location} • {cls.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.open('https://www.corepoweryoga.com/yoga-schedules/studio', '_blank')}
                className="flex-1 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
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

            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Recent Classes</h3>
              <div className="space-y-1 max-h-[180px] overflow-y-auto">
                {recentClassesSorted.map((cls, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{cls.classType}</p>
                        <p className="text-xs text-gray-500">{cls.teacher} • {cls.time}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{cls.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {stats.buddyPasses > 0 && (
          <div className={`p-3 rounded-lg ${daysUntilExpiry <= 14 ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${daysUntilExpiry <= 14 ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className="text-sm font-medium">{stats.buddyPasses} Buddy Pass{stats.buddyPasses !== 1 ? 'es' : ''}</span>
              </div>
              <span className={`text-xs ${daysUntilExpiry <= 14 ? 'text-red-400 font-medium' : 'text-yellow-400'}`}>{daysUntilExpiry} days left</span>
            </div>
          </div>
        )}

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
