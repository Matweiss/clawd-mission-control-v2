import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Zap, Calendar, Mail, TrendingUp, Activity, 
  Dumbbell, X, Check, Sparkles
} from 'lucide-react';
import { hapticFeedback, getSmartSuggestions, scheduleNotification } from '../../lib/ios-utils';

export function MobileHomeTab() {
  const [haStatus, setHaStatus] = useState<any>(null);
  const [yogaClasses, setYogaClasses] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showYogaLog, setShowYogaLog] = useState(false);
  const [yogaStreak, setYogaStreak] = useState(4);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [haRes, yogaRes, moviesRes] = await Promise.all([
        fetch('/api/ha/presence'),
        fetch('/api/yoga/schedule'),
        fetch('/api/movies/regal-sherman-oaks')
      ]);

      if (haRes.ok) {
        const haData = await haRes.json();
        setHaStatus(haData);
      }

      if (yogaRes.ok) {
        const yogaData = await yogaRes.json();
        const allClasses = yogaData.studios?.flatMap((s: any) => s.classes) || [];
        setYogaClasses(allClasses);
      }

      if (moviesRes.ok) {
        const moviesData = await moviesRes.json();
        setMovies(moviesData.movies || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate smart suggestions when data loads
  useEffect(() => {
    if (yogaClasses.length > 0 || movies.length > 0) {
      const smartSuggestions = getSmartSuggestions(yogaClasses, movies);
      setSuggestions(smartSuggestions.filter(s => !dismissedSuggestions.includes(s)));
    }
  }, [yogaClasses, movies, dismissedSuggestions]);

  const dismissSuggestion = (suggestion: string) => {
    hapticFeedback('light');
    setDismissedSuggestions(prev => [...prev, suggestion]);
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const logYoga = () => {
    hapticFeedback('success');
    setYogaStreak(prev => prev + 1);
    setShowYogaLog(false);
    
    // Schedule streak notification for tomorrow
    scheduleNotification('Yoga Streak! 🔥', {
      body: `You're on a ${yogaStreak + 1} day streak. Keep it up!`,
      delay: 24 * 60 * 60 * 1000, // 24 hours
      tag: 'yoga-streak'
    });
  };

  const quickActions = [
    { icon: Zap, label: 'Quick Actions', color: 'text-yellow-400', bg: 'bg-yellow-400/10', onClick: () => hapticFeedback('light') },
    { icon: Calendar, label: 'Calendar', color: 'text-blue-400', bg: 'bg-blue-400/10', onClick: () => hapticFeedback('light') },
    { icon: Mail, label: 'Emails', color: 'text-pink-400', bg: 'bg-pink-400/10', onClick: () => hapticFeedback('light') },
    { icon: TrendingUp, label: 'Pipeline', color: 'text-cyan-400', bg: 'bg-cyan-400/10', onClick: () => hapticFeedback('light') },
  ];

  return (
    <div className="space-y-6">
      {/* Smart Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Smart Suggestions</span>
            </div>
            
            {suggestions.map((suggestion, i) => (
              <motion.div
                key={suggestion}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-work/10 border border-work/30 rounded-2xl p-4 flex items-center justify-between"
              >
                <p className="text-sm flex-1 pr-4">{suggestion}</p>
                <button
                  onClick={() => dismissSuggestion(suggestion)}
                  className="p-1 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Yoga Quick Log */}
      <motion.div 
        className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-2xl p-4 border border-orange-500/30"
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          hapticFeedback('medium');
          setShowYogaLog(true);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold">Log Yoga Session</p>
              <p className="text-sm text-gray-400">{ yogaStreak} day streak 🔥</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium">
            Log
          </button>
        </div>
      </motion.div>

      {/* Yoga Log Modal */}
      <AnimatePresence>
        {showYogaLog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowYogaLog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/3 bg-surface rounded-3xl p-6 z-50 border border-border"
            >
              <h3 className="text-xl font-semibold mb-4">Log Yoga Session</h3>
              
              <div className="space-y-3 mb-6">
                <button 
                  className="w-full p-4 bg-surface-light rounded-xl flex items-center justify-between"
                  onClick={() => hapticFeedback('light')}
                >
                  <span>Class Type</span>
                  <span className="text-gray-400">C2 - CorePower Yoga 2</span>
                </button>
                
                <button 
                  className="w-full p-4 bg-surface-light rounded-xl flex items-center justify-between"
                  onClick={() => hapticFeedback('light')}
                >
                  <span>Studio</span>
                  <span className="text-gray-400">Sherman Oaks</span>
                </button>
                
                <button 
                  className="w-full p-4 bg-surface-light rounded-xl flex items-center justify-between"
                  onClick={() => hapticFeedback('light')}
                >
                  <span>Energy Level</span>
                  <span className="text-gray-400">💪 Strong</span>
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowYogaLog(false)}
                  className="flex-1 py-3 bg-surface-light rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={logYoga}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Status Card */}
      <motion.div 
        className="bg-surface-light rounded-2xl p-4 border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
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
      </motion.div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${action.bg}`}
                whileTap={{ scale: 0.9 }}
                onClick={action.onClick}
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
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
              <motion.div 
                key={i} 
                className="flex items-center gap-3 p-3 bg-surface-light rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div className={`p-2 rounded-lg bg-surface ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{item.text}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
