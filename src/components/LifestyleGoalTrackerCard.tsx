import React from 'react';
import { Moon, Activity, Footprints, CheckCircle2 } from 'lucide-react';

const goals = [
  { key: 'sleep', label: 'Sleep Target', value: '7.5h', progress: 83, detail: '6.2h average last night', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
  { key: 'yoga', label: 'Yoga / Week', value: '2 / 3', progress: 67, detail: 'One more session this week', icon: <Activity className="w-4 h-4 text-purple-400" /> },
  { key: 'steps', label: 'Steps', value: '8,432 / 10,000', progress: 84, detail: '1,568 to goal', icon: <Footprints className="w-4 h-4 text-orange-400" /> },
];

export function LifestyleGoalTrackerCard() {
  return (
    <div className="bg-surface border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Lifestyle Goal Tracker</h2>
            <p className="text-xs text-gray-500">Sleep, yoga, and steps</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">In progress</span>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <div key={goal.key} className="rounded-xl border border-border/70 bg-surface-light p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {goal.icon}
                <span className="text-sm text-white font-medium">{goal.label}</span>
              </div>
              <span className="text-sm font-semibold text-white">{goal.value}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#111] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400" style={{ width: `${goal.progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>{goal.detail}</span>
              <span>{goal.progress}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <span>Source: lifestyle tracker</span>
        <span>Weekly rhythm &gt; fake perfection</span>
      </div>
    </div>
  );
}
