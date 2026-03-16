import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, TrendingUp, Award, Clock, MapPin } from 'lucide-react';

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

export function YogaCard() {
  const [stats, setStats] = useState<YogaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYogaData();
    // Refresh every 5 minutes
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
      // Fallback to static data
      setStats({
        totalClasses: 51,
        studioClasses: 50,
        liveClasses: 1,
        recentClasses: [
          { date: 'Mar 16', classType: 'YS - Yoga Sculpt', teacher: 'Linnie S', time: '4:15pm', location: 'Encino' },
          { date: 'Mar 15', classType: 'YS - Yoga Sculpt', teacher: 'Danielle S', time: '4:15pm', location: 'Encino' },
          { date: 'Mar 14', classType: 'C2 - CorePower Yoga 2', teacher: 'Kylie B', time: '4:15pm', location: 'Encino' },
          { date: 'Mar 13', classType: 'YS - Yoga Sculpt', teacher: 'Danielle S', time: '4:15pm', location: 'Encino' },
          { date: 'Mar 10', classType: 'YS - Yoga Sculpt', teacher: 'Jacqueline M', time: '4:15pm', location: 'Encino' },
        ],
        buddyPasses: 2,
        buddyPassExpiry: '2026-04-01',
        completedChallenge: 'Live Your Power Challenge (Jan 2026)',
      });
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExpiry = stats?.buddyPassExpiry
    ? Math.ceil((new Date(stats.buddyPassExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

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
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">CorePower Yoga</h2>
              <p className="text-xs text-gray-500">All Access Member</p>
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
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-surface-light rounded-lg">
            <div className="text-2xl font-bold text-orange-400">{stats.totalClasses}</div>
            <div className="text-xs text-gray-500">Total Classes</div>
          </div>
          <div className="text-center p-3 bg-surface-light rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.studioClasses}</div>
            <div className="text-xs text-gray-500">Studio</div>
          </div>
          <div className="text-center p-3 bg-surface-light rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{stats.liveClasses}</div>
            <div className="text-xs text-gray-500">Live</div>
          </div>
        </div>

        {/* Recent Classes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase">Recent Classes</h3>
            <span className="text-xs text-gray-500">Last 5</span>
          </div>
          <div className="space-y-2">
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

        {/* Buddy Pass Alert */}
        {stats.buddyPasses > 0 && (
          <div className={`p-3 rounded-lg ${daysUntilExpiry <= 14 ? 'bg-red-500/10 border border-red-500/30' : 'bg-surface-light'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${daysUntilExpiry <= 14 ? 'text-red-400' : 'text-yellow-400'}`} />
                <span className="text-sm font-medium">
                  {stats.buddyPasses} Buddy Pass{stats.buddyPasses !== 1 ? 'es' : ''}
                </span>
              </div>
              <span className={`text-xs ${daysUntilExpiry <= 14 ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                Expires in {daysUntilExpiry} days
              </span>
            </div>
          </div>
        )}

        {/* Completed Challenge */}
        {stats.completedChallenge && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">{stats.completedChallenge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
