import React from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Download, LogOut, Info, Mic, ChevronRight } from 'lucide-react';
import { SIRI_SHORTCUTS, isShortcutsAvailable, openShortcutsApp } from '../../lib/siri-shortcuts';
import { hapticFeedback } from '../../lib/ios-utils';

interface MobileMoreTabProps {
  onInstall: () => void;
  isInstalled: boolean;
}

export function MobileMoreTab({ onInstall, isInstalled }: MobileMoreTabProps) {
  const menuItems = [
    { icon: User, label: 'Profile', color: 'text-blue-400' },
    { icon: Bell, label: 'Notifications', color: 'text-yellow-400' },
    { icon: Settings, label: 'Settings', color: 'text-gray-400' },
    { icon: Info, label: 'About', color: 'text-purple-400' },
  ];

  const handleShortcutPress = (shortcut: typeof SIRI_SHORTCUTS[0]) => {
    hapticFeedback('medium');
    openShortcutsApp(shortcut);
  };

  return (
    <div className="space-y-4">
      {/* Install App Card */}
      {!isInstalled && (
        <motion.div 
          className="bg-work/10 border border-work/30 rounded-2xl p-4"
          whileTap={{ scale: 0.98 }}
          onClick={onInstall}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-work/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦞</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Install Mission Control</h3>
              <p className="text-sm text-gray-400">Add to home screen for quick access</p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 bg-work text-white rounded-xl font-medium">
            Install App
          </button>
        </motion.div>
      )}

      {/* Siri Shortcuts */}
      {isShortcutsAvailable() && (
        <div className="bg-surface-light rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Siri Shortcuts</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Tap to add voice commands</p>
          </div>
          
          <div className="divide-y divide-border">
            {SIRI_SHORTCUTS.map((shortcut, index) => (
              <motion.button
                key={shortcut.name}
                className="w-full flex items-center gap-3 p-4"
                whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' }}
                onClick={() => handleShortcutPress(shortcut)}
              >
                <span className="text-2xl">{shortcut.icon}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium">{shortcut.name}</p>
                  <p className="text-xs text-gray-500">"{shortcut.phrase}""</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="bg-surface-light rounded-2xl border border-border overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              className={`w-full flex items-center gap-3 p-4 ${
                index !== menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
              whileTap={{ scale: 0.98, backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => hapticFeedback('light')}
            >
              <Icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.button>
          );
        })}
      </div>

      {/* App Info */}
      <div className="text-center py-8">
        <span className="text-4xl">🦞</span>
        <p className="mt-2 font-semibold">Mission Control</p>
        <p className="text-sm text-gray-500">Version 2.0.0</p>
        <p className="text-xs text-gray-600 mt-4">Built with ❤️ by Clawd</p>
      </div>

      {/* Logout */}
      <motion.button 
        className="w-full flex items-center justify-center gap-2 p-4 text-red-400"
        whileTap={{ scale: 0.95 }}
        onClick={() => hapticFeedback('error')}
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </motion.button>
    </div>
  );
}
