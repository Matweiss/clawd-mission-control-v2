import React from 'react';
import { LayoutGrid, Palette } from 'lucide-react';
import { DashboardMode } from '../lib/dashboard-config';

interface DashboardModeSwitchProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

export function DashboardModeSwitch({ mode, onChange }: DashboardModeSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-light p-1">
      <button
        onClick={() => onChange('mat')}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
          mode === 'mat' ? 'bg-surface text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Mat</span>
      </button>
      <button
        onClick={() => onChange('sarah')}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
          mode === 'sarah' ? 'bg-surface text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Palette className="w-4 h-4" />
        <span>Sarah</span>
      </button>
    </div>
  );
}
