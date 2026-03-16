import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Film, Dumbbell, Coffee, ExternalLink, MapPin } from 'lucide-react';

interface Recommendation {
  type: 'yoga' | 'movie' | 'break';
  title: string;
  time: string;
  duration: string;
  reason: string;
  action: string;
  location?: string;
  format?: string;
}

export function RecommendationsCard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSmartRecommendations();
  }, []);

  const generateSmartRecommendations = () => {
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate recommendations based on time of day and real data
    const smartRecs: Recommendation[] = [];
    
    // Morning yoga recommendation (if before 10am)
    if (currentHour < 10) {
      smartRecs.push({
        type: 'yoga',
        title: 'C1 - CorePower Yoga 1',
        time: '9:30am',
        duration: '60 min',
        reason: 'Perfect morning flow to start your day',
        action: 'Book at Encino',
        location: 'Encino',
      });
    }
    
    // Afternoon yoga (if between 12-4pm)
    if (currentHour >= 12 && currentHour < 16) {
      smartRecs.push({
        type: 'yoga',
        title: 'YS - Yoga Sculpt',
        time: '4:30pm',
        duration: '60 min',
        reason: 'Your usual time - consistency is key',
        action: 'Book now',
        location: 'Encino',
      });
    }
    
    // Evening movie recommendations based on real Regal data
    smartRecs.push({
      type: 'movie',
      title: 'Project Hail Mary',
      time: '7:00pm',
      duration: '2h 36m',
      reason: 'Perfect after 4:30pm yoga - time for dinner',
      action: 'Book IMAX',
      location: 'Sherman Oaks Galleria',
      format: 'IMAX',
    });
    
    smartRecs.push({
      type: 'movie',
      title: 'Ready or Not 2: Here I Come',
      time: '8:00pm',
      duration: '1h 48m',
      reason: 'Horror comedy - shorter runtime',
      action: 'Book tickets',
      location: 'Sherman Oaks Galleria',
      format: 'RPX',
    });
    
    smartRecs.push({
      type: 'movie',
      title: 'The Bride!',
      time: '6:50pm',
      duration: '2h 6m',
      reason: 'Early show - home by 9:30pm',
      action: 'Book now',
      location: 'Sherman Oaks Galleria',
    });
    
    setRecommendations(smartRecs);
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'yoga': return <Dumbbell className="w-4 h-4" />;
      case 'movie': return <Film className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'yoga': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'movie': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      case 'break': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-light rounded w-1/3" />
          <div className="h-8 bg-surface-light rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-work/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-work" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Smart Suggestions</h2>
              <p className="text-xs text-gray-500">Based on your schedule</p>
            </div>
          </div>
          <button 
            onClick={generateSmartRecommendations}
            className="text-xs text-work hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {recommendations.map((rec, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-lg border ${getColor(rec.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getIcon(rec.type)}
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate">{rec.title}</h3>
                  <p className="text-xs opacity-80 truncate">{rec.reason}</p>
                </div>
              </div>
              <div className="text-right ml-2 shrink-0">
                <span className="text-xs font-medium">{rec.time}</span>
                <p className="text-xs opacity-70">{rec.duration}</p>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs opacity-60">
                <MapPin className="w-3 h-3" />
                <span>{rec.location}</span>
                {rec.format && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-[10px]">
                    {rec.format}
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  if (rec.type === 'yoga') {
                    window.open('https://www.corepoweryoga.com/yoga-schedules', '_blank');
                  } else if (rec.type === 'movie') {
                    window.open('https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483', '_blank');
                  }
                }}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
              >
                {rec.action}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        
        {/* View full schedule hint */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-gray-500 text-center">
            See full schedules in Yoga and Movies cards
          </p>
        </div>
      </div>
    </div>
  );
}
