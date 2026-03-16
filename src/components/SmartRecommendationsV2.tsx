import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Film, Dumbbell, Coffee, ExternalLink, MapPin, AlertTriangle } from 'lucide-react';

interface SmartRecommendation {
  id: string;
  type: 'yoga' | 'movie' | 'break' | 'alert';
  title: string;
  time?: string;
  duration?: string;
  reason: string;
  action: string;
  location?: string;
  format?: string;
  priority: 'high' | 'medium' | 'low';
  cta?: string;
}

export function SmartRecommendationsV2() {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSmartRecommendations();
  }, []);

  const generateSmartRecommendations = async () => {
    setLoading(true);
    
    const now = new Date();
    const currentHour = now.getHours();
    const recs: SmartRecommendation[] = [];
    
    // Priority alerts first
    const buddyPassDays = 16; // Would fetch from API
    if (buddyPassDays <= 14) {
      recs.push({
        id: 'buddy-alert',
        type: 'alert',
        title: 'Buddy Passes Expiring Soon',
        reason: `Only ${buddyPassDays} days left to use 2 buddy passes`,
        action: 'View schedule',
        priority: 'high',
        cta: 'Book now',
      });
    }
    
    // Check last yoga (would fetch from API)
    const daysSinceYoga = 0; // Today
    if (daysSinceYoga >= 2) {
      recs.push({
        id: 'yoga-nudge',
        type: 'alert',
        title: 'No Yoga in 2 Days',
        reason: 'Consistency is key for your practice',
        action: 'Book a class',
        priority: 'medium',
        cta: 'Book 4:30pm',
      });
    }
    
    // Time-based recommendations
    if (currentHour >= 10 && currentHour < 16) {
      // Afternoon - suggest yoga
      recs.push({
        id: 'yoga-afternoon',
        type: 'yoga',
        title: 'YS - Yoga Sculpt',
        time: '4:30pm',
        duration: '60 min',
        reason: 'Perfect afternoon energizer',
        action: 'Book at Encino',
        location: 'Encino',
        priority: 'medium',
        cta: 'Reserve spot',
      });
    }
    
    if (currentHour >= 17) {
      // Evening - suggest movie after yoga
      recs.push({
        id: 'movie-evening',
        type: 'movie',
        title: 'Project Hail Mary',
        time: '7:00pm',
        duration: '2h 36m',
        reason: 'Perfect after 4:30pm yoga - time for dinner first',
        action: 'Book IMAX',
        location: 'Sherman Oaks Galleria',
        format: 'IMAX',
        priority: 'medium',
        cta: 'Get tickets',
      });
      
      recs.push({
        id: 'movie-alt',
        type: 'movie',
        title: 'Ready or Not 2',
        time: '8:00pm',
        duration: '1h 48m',
        reason: 'Shorter runtime if you want an early night',
        action: 'Book tickets',
        location: 'Sherman Oaks Galleria',
        priority: 'low',
        cta: 'Get tickets',
      });
    }
    
    // Free time suggestion
    recs.push({
      id: 'break',
      type: 'break',
      title: 'Quick Reset',
      duration: '5 min',
      reason: 'Take a breather between tasks',
      action: 'Start now',
      priority: 'low',
      cta: 'Breathe',
    });
    
    setRecommendations(recs);
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'yoga': return <Dumbbell className="w-4 h-4" />;
      case 'movie': return <Film className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (priority === 'medium') return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
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
        </div>
      </div>
    );
  }

  // Separate high priority alerts
  const alerts = recommendations.filter(r => r.priority === 'high');
  const normal = recommendations.filter(r => r.priority !== 'high');

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
        {/* High Priority Alerts */}
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className="p-3 rounded-lg border bg-red-500/10 border-red-500/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-sm text-white">{alert.title}</h3>
                <p className="text-xs text-red-200 mt-1">{alert.reason}</p>
                {alert.cta && (
                  <button className="mt-2 text-xs bg-red-500/20 text-red-300 px-3 py-1.5 rounded hover:bg-red-500/30">
                    {alert.cta}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Normal Recommendations */}
        {normal.slice(0, 3).map((rec) => (
          <div 
            key={rec.id} 
            className={`p-3 rounded-lg border ${getColor(rec.type, rec.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getIcon(rec.type)}
                <div className="min-w-0">
                  <h3 className="font-medium text-sm truncate">{rec.title}</h3>
                  <p className="text-xs opacity-80 truncate">{rec.reason}</p>
                </div>
              </div>
              {rec.time && (
                <div className="text-right ml-2 shrink-0">
                  <span className="text-xs font-medium">{rec.time}</span>
                  {rec.duration && <p className="text-xs opacity-70">{rec.duration}</p>}
                </div>
              )}
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs opacity-60">
                <MapPin className="w-3 h-3" />
                <span>{rec.location || 'Anywhere'}</span>
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
                {rec.cta || rec.action}
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        
        {recommendations.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No suggestions right now</p>
            <p className="text-xs mt-1">Check back after calendar sync</p>
          </div>
        )}
      </div>
    </div>
  );
}
