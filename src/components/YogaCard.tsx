import React, { useEffect, useState } from 'react';
import { Dumbbell, Clock, MapPin, RefreshCw, ExternalLink, Flame } from 'lucide-react';

interface YogaClass {
  time: string;
  name: string;
  instructor: string;
  duration: string;
  type: string;
}

interface Studio {
  name: string;
  url: string;
  classes: YogaClass[];
  count: number;
}

interface YogaData {
  source: string;
  date: string;
  activeDay: 'sun' | 'mon';
  days?: Array<{ key: 'sun' | 'mon'; label: string; date: string; totalClasses: number }>;
  studios: Studio[];
  classTypes: Record<string, { name: string; description: string; level: string }>;
  preferredClasses: string[];
  totalClasses: number;
  lastUpdated: string;
}

export function YogaCard() {
  const [data, setData] = useState<YogaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStudio, setActiveStudio] = useState<'Sherman Oaks' | 'Encino'>('Encino');
  const [activeDay, setActiveDay] = useState<'sun' | 'mon'>('sun');

  const fetchData = async (day: 'sun' | 'mon' = activeDay) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/yoga/schedule?day=${day}`);
      if (response.ok) {
        const yogaData = await response.json();
        setData(yogaData);
        if (yogaData?.activeDay) setActiveDay(yogaData.activeDay);
      }
    } catch (err) {
      console.error('Error fetching yoga data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentStudio = data?.studios.find(s => s.name === activeStudio);

  const getClassColor = (type: string) => {
    switch (type) {
      case 'C1': return 'bg-green-500/10 text-green-400';
      case 'C2': return 'bg-blue-500/10 text-blue-400';
      case 'C3': return 'bg-purple-500/10 text-purple-400';
      case 'YS': return 'bg-orange-500/10 text-orange-400';
      case 'HPF': return 'bg-red-500/10 text-red-400';
      case 'CSX': return 'bg-pink-500/10 text-pink-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-sm font-semibold text-white">Yoga</h2>
              <p className="text-xs text-gray-500">CorePower • {data?.totalClasses || 0} classes • {activeDay === 'sun' ? 'Sunday' : 'Monday'}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 mb-2">
          {[{ key: 'sun', label: 'Sunday' }, { key: 'mon', label: 'Monday' }].map((day) => (
            <button
              key={day.key}
              onClick={() => {
                setActiveDay(day.key as 'sun' | 'mon');
                fetchData(day.key as 'sun' | 'mon');
              }}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeDay === day.key
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'bg-surface-light text-gray-400 hover:text-gray-300'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Studio Tabs */}
        <div className="flex flex-wrap gap-2">
          {['Sherman Oaks', 'Encino'].map((studio) => (
            <button
              key={studio}
              onClick={() => setActiveStudio(studio as any)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                activeStudio === studio
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-surface-light text-gray-400 hover:text-gray-300'
              }`}
            >
              {studio} ({data?.studios.find(s => s.name === studio)?.count || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Class Schedule */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {!currentStudio ? (
            <div className="text-center py-8 text-gray-500">
              <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{loading ? 'Loading classes...' : 'No classes available'}</p>
            </div>
          ) : currentStudio.classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Flame className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No classes today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentStudio.classes.map((cls, index) => (
                <div key={index} className="p-3 bg-surface-light rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${getClassColor(cls.type)}`}>
                          {cls.type}
                        </span>
                        <span className="text-xs text-gray-500">{cls.duration}</span>
                      </div>
                      <h3 className="font-medium text-sm">{cls.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{cls.time}</span>
                        <span className="text-gray-600">•</span>
                        <span>{cls.instructor}</span>
                      </div>
                    </div>
                    <a
                      href={currentStudio.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-orange-400 hover:bg-orange-500/10 rounded"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        {data && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-gray-500 mb-2">Class Types:</p>
            <div className="flex flex-wrap gap-2">
              {data.preferredClasses?.map((code) => {
                const info = data.classTypes[code];
                if (!info) return null;
                return (
                  <div key={code} className="flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${getClassColor(code)}`}>{code}</span>
                    <span className="text-xs text-gray-600">{info.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
