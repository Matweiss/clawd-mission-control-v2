import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Film, Dumbbell, Coffee, ExternalLink } from 'lucide-react';

interface Recommendation {
  type: 'yoga' | 'movie' | 'break';
  title: string;
  time: string;
  duration: string;
  reason: string;
  action: string;
}

export function RecommendationsCard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
    // Refresh every 15 minutes
    const interval = setInterval(fetchRecommendations, 900000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations');
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
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

  if (recommendations.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-work" />
          <h2 className="text-sm font-semibold text-white">Smart Suggestions</h2>
        </div>
        <p className="text-sm text-gray-500">No suggestions right now. Check back after calendar sync.</p>
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
              <p className="text-xs text-gray-500">Based on your calendar</p>
            </div>
          </div>
          <button 
            onClick={fetchRecommendations}
            className="text-xs text-work hover:underline"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {recommendations.slice(0, 3).map((rec, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-lg border ${getColor(rec.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getIcon(rec.type)}
                <div>
                  <h3 className="font-medium text-sm">{rec.title}</h3>
                  <p className="text-xs opacity-80">{rec.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium">{rec.time}</span>
                <p className="text-xs opacity-70">{rec.duration}</p>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs opacity-60">
                {rec.type === 'yoga' ? 'Encino Studio' : rec.type === 'movie' ? 'Streaming' : 'Anywhere'}
              </span>
              <button 
                onClick={() => {
                  if (rec.type === 'yoga') {
                    window.open('https://www.corepoweryoga.com/yoga-schedules', '_blank');
                  } else if (rec.type === 'movie') {
                    // Add to watchlist
                    fetch('/api/movies/list', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: rec.title,
                        year: '2024',
                        status: 'watchlist',
                      }),
                    });
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
      </div>
    </div>
  );
}
