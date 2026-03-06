import React, { useState } from 'react';
import { 
  LayoutDashboard, Mail, Calendar, TrendingUp, 
  Activity, Zap, Settings, X, Menu, Heart,
  Home, Dog, FileText
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-white' },
  { id: 'agents', label: 'Agent Command', icon: Zap, color: 'text-yellow-400' },
  { id: 'pipeline', label: 'Sales Pipeline', icon: TrendingUp, color: 'text-cyan-400' },
  { id: 'email', label: 'Email Intel', icon: Mail, color: 'text-pink-400' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, color: 'text-blue-400' },
  { id: 'lifestyle', label: 'Lifestyle', icon: Heart, color: 'text-purple-400' },
  { id: 'pets', label: 'Pet Tracker', icon: Dog, color: 'text-orange-400' },
  { id: 'home', label: 'Home Control', icon: Home, color: 'text-green-400' },
  { id: 'docs', label: 'Documents', icon: FileText, color: 'text-gray-400' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-500' },
];

export function Sidebar({ activeView, onViewChange, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-lg lg:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-surface border-r border-border z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <span className="text-xl">🦞</span>
            </div>
            <div>
              <h1 className="font-bold text-white">Mission Control</h1>
              <p className="text-xs text-gray-500">CLAWD Prime</p>
            </div>
          </div>
        </div>

        <nav className="p-2 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  onToggle(); // Close on mobile
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${isActive 
                    ? 'bg-surface-light text-white border-l-2 border-orange-500' 
                    : 'text-gray-400 hover:bg-surface-light hover:text-gray-200'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : item.color}`} />
                <span>{item.label}</span>
                
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>7/7 Agents Online</span>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
