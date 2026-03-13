import React, { useEffect, useState } from 'react';
import { Home, Zap, Calendar, Mail, TrendingUp, Activity } from 'lucide-react';

export function MobileHomeTab() {
  const [haStatus, setHaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHAStatus();
  }, []);

  const fetchHAStatus = async () => {
    try {
      const response = await fetch('/api/ha/presence');
      if (response.ok) {
        const data = await response.json();
        setHaStatus(data);
      }
    } catch (err) {
      console.error('Error fetching HA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Zap, label: 'Quick Actions', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { icon: Calendar, label: 'Calendar', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Mail, label: 'Emails', color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { icon: TrendingUp, label: 'Pipeline', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-surface-light rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-work" />
            <span className="font-medium">Home Status</span>
          </div>
          <span className="text-xs text-gray-500">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} PT</span>
        </div>
        
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-surface rounded w-3/4"></div>
            <div className="h-4 bg-surface rounded w-1/2"></div>
          </div>
        ) : haStatus ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Location</span>
              <span className={`text-sm font-medium ${haStatus.location === 'home' ? 'text-green-400' : 'text-yellow-400'}`}>
                {haStatus.location === 'home' ? '🏠 Home' : '🚗 Away'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Front Door</span>
              <span className={`text-sm font-medium ${haStatus.locks?.front_door === 'locked' ? 'text-green-400' : 'text-red-400'}`}>
                {haStatus.locks?.front_door === 'locked' ? '🔒 Locked' : '🔓 Unlocked'}
              </span>
            </div>
            {haStatus.pets && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pets</span>
                <span className="text-sm">{haStatus.pets.diggy} 🐕 {haStatus.pets.theo} 🐈</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Unable to load home status</p>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.bg} transition-transform active:scale-95`}
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { icon: Activity, text: 'Home Assistant connected', time: '2 min ago', color: 'text-green-400' },
            { icon: Mail, text: '3 new emails', time: '15 min ago', color: 'text-pink-400' },
            { icon: Calendar, text: 'Meeting in 1 hour', time: '30 min ago', color: 'text-blue-400' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-light rounded-xl">
                <div className={`p-2 rounded-lg bg-surface ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
