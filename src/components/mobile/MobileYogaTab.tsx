import React, { useEffect, useState } from 'react';
import { Dumbbell, Clock, MapPin, ExternalLink, Flame } from 'lucide-react';

interface YogaClass {
  time: string;
  name: string;
  instructor: string;
  duration: string;
  type: string;
}

interface Studio {
  name: string;
  classes: YogaClass[];
}

export function MobileYogaTab() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [activeStudio, setActiveStudio] = useState('Encino');
  const [activeDay, setActiveDay] = useState<'sun' | 'mon'>('sun');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYoga();
  }, []);

  const fetchYoga = async (day: 'sun' | 'mon' = activeDay) => {
    try {
      const response = await fetch(`/api/yoga/schedule?day=${day}`);
      if (response.ok) {
        const data = await response.json();
        setStudios(data.studios || []);
        if (data?.activeDay) setActiveDay(data.activeDay);
      }
    } catch (err) {
      console.error('Error fetching yoga:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentStudio = studios.find(s => s.name === activeStudio);

  const getClassColor = (type: string) => {
    switch (type) {
      case 'C2': return 'bg-blue-500 text-white';
      case 'C3': return 'bg-purple-500 text-white';
      case 'YS': return 'bg-orange-500 text-white';
      case 'CSX': return 'bg-pink-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Dumbbell className="w-8 h-8 text-gray-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex gap-2">
        {[{ key: 'sun', label: 'Sunday' }, { key: 'mon', label: 'Monday' }].map((day) => (
          <button
            key={day.key}
            onClick={() => {
              setActiveDay(day.key as 'sun' | 'mon');
              fetchYoga(day.key as 'sun' | 'mon');
            }}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeDay === day.key
                ? 'bg-cyan-500 text-white'
                : 'bg-surface-light text-gray-400'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Studio Selector */}
      <div className="flex gap-2">
        {['Sherman Oaks', 'Encino'].map((studio) => (
          <button
            key={studio}
            onClick={() => setActiveStudio(studio)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              activeStudio === studio
                ? 'bg-orange-500 text-white'
                : 'bg-surface-light text-gray-400'
            }`}
          >
            {studio}
          </button>
        ))}
      </div>

      {/* Classes */}
      <div className="space-y-3">
        {currentStudio?.classes.map((cls, index) => (
          <div key={index} className="bg-surface-light rounded-2xl p-4 border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getClassColor(cls.type)}`}>
                    {cls.type}
                  </span>
                  <span className="text-xs text-gray-500">{cls.duration}</span>
                </div>
                
                <h3 className="font-semibold text-lg">{cls.name}</h3>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{cls.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">{cls.instructor}</span>
                  </div>
                </div>
              </div>

              <a
                href="https://www.corepoweryoga.com/yoga-schedules"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-orange-500/10 text-orange-400 rounded-xl"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {currentStudio?.classes.length === 0 && (
        <div className="text-center py-20">
          <Flame className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">No classes today</p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-surface-light rounded-2xl p-4 border border-border">
        <p className="text-sm text-gray-400 mb-3">Class Types</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: 'C2', name: 'CorePower Yoga 2', color: 'bg-blue-500' },
            { code: 'C3', name: 'CorePower Yoga 3', color: 'bg-purple-500' },
            { code: 'YS', name: 'Yoga Sculpt', color: 'bg-orange-500' },
            { code: 'CSX', name: 'CorePower Strength X', color: 'bg-pink-500' },
          ].map((type) => (
            <div key={type.code} className="flex items-center gap-2">
              <span className={`w-6 h-6 ${type.color} rounded-lg flex items-center justify-center text-xs font-bold`}>{type.code}</span>
              <span className="text-xs text-gray-400">{type.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
