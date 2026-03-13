import React from 'react';
import { Settings, User, Bell, Download, LogOut, Info } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* Install App Card */}
      {!isInstalled && (
        <div className="bg-work/10 border border-work/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-work/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦞</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Install Mission Control</h3>
              <p className="text-sm text-gray-400">Add to home screen for quick access</p>
            </div>
          </div>
          <button
            onClick={onInstall}
            className="w-full mt-4 py-3 bg-work text-white rounded-xl font-medium"
          >
            Install App
          </button>
        </div>
      )}

      {/* Menu Items */}
      <div className="bg-surface-light rounded-2xl border border-border overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 p-4 ${
                index !== menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${item.color}`} />
              <span className="flex-1 text-left">{item.label}</span>
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
      <button className="w-full flex items-center justify-center gap-2 p-4 text-red-400">
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </div>
  );
}
