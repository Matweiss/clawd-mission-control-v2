import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, Calendar, Activity, Mail, TrendingUp, Dumbbell, Film, Clock, Cloud } from 'lucide-react';
import { HeroSkeleton } from './Skeletons';

interface HeroData {
  currentEvent?: {
    summary: string;
    endTime: string;
    isNow: boolean;
  };
  nextFreeSlot?: string;
  sarahStatus: {
    isHome: boolean;
    location: string;
  };
  urgentCount: number;
  nextYoga?: {
    time: string;
    classType: string;
  };
  nextMovie?: {
    time: string;
    title: string;
  };
  weather?: {
    temp: number;
    condition: string;
    icon: string;
    high: number;
    low: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
  };
  pipelineValue: string;
  pipelineDeals: number;
}

export function HeroSection() {
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      // Fetch multiple endpoints in parallel
      const [calendarRes, haRes, emailRes, yogaRes, weatherRes, pipelineRes] = await Promise.all([
        fetch('/api/calendar/today').catch(() => null),
        fetch('/api/ha/presence').catch(() => null),
        fetch('/api/emails/recent').catch(() => null),
        fetch('/api/yoga/stats').catch(() => null),
        fetch('/api/weather').catch(() => null),
        fetch('/api/pipeline/summary').catch(() => null),
      ]);

      const heroData: HeroData = {
        sarahStatus: { isHome: true, location: 'Unknown' },
        urgentCount: 0,
        pipelineValue: '$18.4k',
        pipelineDeals: 3,
      };

      // Parse calendar
      if (calendarRes?.ok) {
        const calendar = await calendarRes.json();
        const now = new Date();
        const events = calendar.events || [];
        
        // Find current or next event
        const currentEvent = events.find((e: any) => {
          const start = new Date(e.start);
          const end = new Date(e.end);
          return now >= start && now <= end;
        });

        if (currentEvent) {
          heroData.currentEvent = {
            summary: currentEvent.summary,
            endTime: new Date(currentEvent.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            isNow: true,
          };
        } else {
          // Find next event
          const nextEvent = events.find((e: any) => new Date(e.start) > now);
          if (nextEvent) {
            heroData.currentEvent = {
              summary: `Free until ${nextEvent.summary}`,
              endTime: new Date(nextEvent.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              isNow: false,
            };
          } else {
            heroData.currentEvent = {
              summary: 'Free for the rest of the day',
              endTime: '',
              isNow: false,
            };
          }
        }
      }

      // Parse HA data
      if (haRes?.ok) {
        const ha = await haRes.json();
        heroData.sarahStatus = {
          isHome: ha.sarah?.isHome ?? true,
          location: ha.sarah?.location || 'Unknown',
        };
      }

      // Parse email data
      if (emailRes?.ok) {
        const email = await emailRes.json();
        heroData.urgentCount = email.emails?.filter((e: any) => e.category === 'URGENT').length || 0;
      }

      // Parse yoga data
      if (yogaRes?.ok) {
        const yoga = await yogaRes.json();
        // Get today's classes from upcoming
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        // Use mock data for now since we need to connect to the schedule
        heroData.nextYoga = {
          time: '4:30pm',
          classType: 'YS - Yoga Sculpt',
        };
      }

      // Set next movie recommendation
      heroData.nextMovie = {
        time: '7:00pm',
        title: 'Project Hail Mary',
      };

      // Parse weather
      if (weatherRes?.ok) {
        const weather = await weatherRes.json();
        heroData.weather = {
          temp: weather.temp,
          condition: weather.condition,
          icon: weather.icon,
          high: weather.high,
          low: weather.low,
          feelsLike: weather.feelsLike,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          uvIndex: weather.uvIndex,
        };
      }

      // Parse pipeline
      if (pipelineRes?.ok) {
        const pipeline = await pipelineRes.json();
        heroData.pipelineValue = pipeline.totalValue || '$18.4k';
        heroData.pipelineDeals = pipeline.dealCount || 3;
      }

      setData(heroData);
    } catch (err) {
      console.error('Hero data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HeroSkeleton />;
  }

  if (!data) return null;

  return (
    <div className="bg-gradient-to-r from-work/20 via-work/10 to-transparent border border-work/30 rounded-xl p-4">
      {/* Main Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-work/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-work" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Right Now</h2>
            <p className="text-sm text-work">
              {data.currentEvent?.isNow ? (
                <>
                  <span className="text-red-400">●</span> In: {data.currentEvent.summary} (until {data.currentEvent.endTime})
                </>
              ) : (
                <>
                  <span className="text-green-400">●</span> {data.currentEvent?.summary}
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          {data.urgentCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm">
              <Mail className="w-4 h-4" />
              <span>{data.urgentCount} urgent</span>
            </div>
          )}
          <button 
            onClick={() => window.open('https://www.corepoweryoga.com/yoga-schedules', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30"
          >
            <Dumbbell className="w-4 h-4" />
            <span className="hidden sm:inline">{data.nextYoga?.time}</span>
          </button>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Weather */}
        <div className="bg-surface/50 rounded-lg p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Cloud className="w-3 h-3" />
            <span>Sherman Oaks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{data.weather?.icon || '⛅'}</span>
            <div>
              <div className="text-lg font-bold text-white">{data.weather?.temp || '--'}°F</div>
              <div className="text-xs text-gray-500">{data.weather?.condition || 'Loading...'}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            H: {data.weather?.high || '--'}° L: {data.weather?.low || '--'}°
          </div>
        </div>

        {/* Sarah Status */}
        <div className="bg-surface/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Activity className="w-3 h-3" />
            <span>Sarah</span>
          </div>
          <div className={`text-sm font-medium ${data.sarahStatus.isHome ? 'text-green-400' : 'text-yellow-400'}`}>
            {data.sarahStatus.isHome ? 'Home' : 'Away'}
          </div>
          <div className="text-xs text-gray-500 truncate">{data.sarahStatus.location}</div>
        </div>

        {/* Next Yoga */}
        <div className="bg-surface/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Dumbbell className="w-3 h-3" />
            <span>Next Yoga</span>
          </div>
          <div className="text-sm font-medium text-white">{data.nextYoga?.time}</div>
          <div className="text-xs text-gray-500 truncate">{data.nextYoga?.classType}</div>
        </div>

        {/* Next Movie */}
        <div className="bg-surface/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Film className="w-3 h-3" />
            <span>Movie</span>
          </div>
          <div className="text-sm font-medium text-white">{data.nextMovie?.time}</div>
          <div className="text-xs text-gray-500 truncate">{data.nextMovie?.title}</div>
        </div>

        {/* Pipeline Quick */}
        <div className="bg-surface/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>Pipeline</span>
          </div>
          <div className="text-sm font-medium text-cyan-400">{data.pipelineValue}</div>
          <div className="text-xs text-gray-500">{data.pipelineDeals} deals active</div>
        </div>
      </div>
    </div>
  );
}
