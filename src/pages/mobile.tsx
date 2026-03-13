import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Home, Film, Dumbbell, Briefcase, MoreHorizontal,
  Bell, Loader2
} from 'lucide-react';
import { MobileHomeTab } from '../components/mobile/MobileHomeTab';
import { MobileMoviesTab } from '../components/mobile/MobileMoviesTab';
import { MobileYogaTab } from '../components/mobile/MobileYogaTab';
import { MobileWorkTab } from '../components/mobile/MobileWorkTab';
import { MobileMoreTab } from '../components/mobile/MobileMoreTab';
import { hapticFeedback, isIOSPWA, requestIOSNotifications } from '../lib/ios-utils';
import { handleShortcutAction, executeShortcutAction } from '../lib/siri-shortcuts';

// Register service worker for PWA
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export default function MobileMissionControl() {
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'yoga' | 'work' | 'more'>('home');
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const controls = useAnimation();

  useEffect(() => {
    registerServiceWorker();
    requestIOSNotifications();

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Handle Siri Shortcuts actions
    const shortcut = handleShortcutAction();
    if (shortcut) {
      const result = executeShortcutAction(shortcut.action);
      if (result.tab) {
        setActiveTab(result.tab as typeof activeTab);
      }
      if (result.message) {
        // Show toast notification
        console.log(result.message);
      }
      // Clear the URL params
      window.history.replaceState({}, '', '/mobile');
    }

    // iOS-specific: Handle pull-to-refresh
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      // Only pull if at top of page
      if (window.scrollY === 0 && diff > 0) {
        e.preventDefault();
        setPullDistance(Math.min(diff * 0.5, 100));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        handleRefresh();
      }
      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticFeedback('medium');
    
    // Reload current tab data
    window.location.reload();
  };

  const handleTabChange = (tab: typeof activeTab) => {
    hapticFeedback('light');
    setActiveTab(tab);
  };

  const handleInstall = async () => {
    hapticFeedback('success');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'movies', icon: Film, label: 'Movies' },
    { id: 'yoga', icon: Dumbbell, label: 'Yoga' },
    { id: 'work', icon: Briefcase, label: 'Work' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <MobileHomeTab />;
      case 'movies': return <MobileMoviesTab />;
      case 'yoga': return <MobileYogaTab />;
      case 'work': return <MobileWorkTab />;
      case 'more': return <MobileMoreTab onInstall={handleInstall} isInstalled={isInstalled} />;
      default: return <MobileHomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-white pb-24 overflow-x-hidden">
      <Head>
        <title>Mission Control</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mission Control" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </Head>

      {/* Pull to Refresh Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        animate={{ y: pullDistance > 80 ? 60 : pullDistance * 0.6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={`w-10 h-10 rounded-full bg-surface-light flex items-center justify-center shadow-lg transition-transform ${
          pullDistance > 80 ? 'rotate-180' : ''
        }`}
        style={{ transform: `rotate(${pullDistance * 2}deg)` }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-work animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-work" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </motion.div>

      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border px-4 py-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="font-semibold text-lg">Mission Control</h1>
          </div>
          <button 
            className="p-2 relative active:scale-95 transition-transform"
            onClick={() => hapticFeedback('light')}
          >
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main 
        ref={contentRef}
        className="p-4"
        style={{ 
          transform: `translateY(${pullDistance * 0.3}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-50 pb-safe"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[64px] relative ${
                  isActive 
                    ? 'text-work' 
                    : 'text-gray-400'
                }`}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-work/20 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={`w-6 h-6 relative z-10 ${isActive ? 'text-work' : ''}`} />
                <span className="text-[11px] font-medium relative z-10">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
