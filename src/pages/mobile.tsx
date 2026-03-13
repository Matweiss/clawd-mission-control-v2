import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Home, Film, Dumbbell, Briefcase, MoreHorizontal,
  Bell, Settings, User, LogOut
} from 'lucide-react';
import { MobileHomeTab } from '../components/mobile/MobileHomeTab';
import { MobileMoviesTab } from '../components/mobile/MobileMoviesTab';
import { MobileYogaTab } from '../components/mobile/MobileYogaTab';
import { MobileWorkTab } from '../components/mobile/MobileWorkTab';
import { MobileMoreTab } from '../components/mobile/MobileMoreTab';

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

// Request push notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
};

export default function MobileMissionControl() {
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'yoga' | 'work' | 'more'>('home');
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Request notification permission
    requestNotificationPermission();
  }, []);

  const handleInstall = async () => {
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
    <div className="min-h-screen bg-background text-white pb-20">
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

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="font-semibold text-lg">Mission Control</h1>
          </div>
          <button className="p-2 relative">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {renderTab()}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[64px] ${
                  isActive 
                    ? 'bg-work/20 text-work' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-work' : ''}`} />
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
