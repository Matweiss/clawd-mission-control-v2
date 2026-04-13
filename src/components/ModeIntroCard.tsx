import React from 'react';
import { Briefcase, Palette } from 'lucide-react';
import { DashboardMode } from '../lib/dashboard-config';

export function ModeIntroCard({ mode }: { mode: DashboardMode }) {
  if (mode === 'sarah') {
    return (
      <div className="mb-4 rounded-xl border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-amber-500/10 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-rose-500/20 p-2 text-rose-200">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-rose-100">Sarah Dashboard</div>
            <div className="text-xs text-rose-100/80 mt-1 max-w-2xl">
              Built for Sarah’s art business, collector follow-up, launch rhythm, and human-approved customer touchpoints.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-cyan-500/20 p-2 text-cyan-200">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-cyan-100">Mat Mission Control</div>
          <div className="text-xs text-cyan-100/80 mt-1 max-w-2xl">
            Your control plane for Lucra, communications, calendar, agents, home operations, and personal logistics.
          </div>
        </div>
      </div>
    </div>
  );
}
