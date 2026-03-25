import React from 'react';
import { motion } from 'framer-motion';

export interface ContextPressureMeterProps {
  used: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatCompact(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `${value}`;
}

export function ContextPressureMeter({
  used,
  max = 128000,
  showLabel = true,
  size = 'sm',
}: ContextPressureMeterProps) {
  const safeMax = max > 0 ? max : 128000;
  const percentage = clamp((used / safeMax) * 100);

  const colorClass = percentage > 90
    ? 'from-red-500 to-red-400'
    : percentage >= 70
      ? 'from-yellow-500 to-amber-400'
      : 'from-emerald-500 to-green-400';

  const heightClass = size === 'md' ? 'h-4' : 'h-3';
  const textClass = size === 'md' ? 'text-[11px]' : 'text-[10px]';

  return (
    <div className="space-y-1" title={`${used.toLocaleString()} / ${safeMax.toLocaleString()} tokens used`}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Context Pressure</span>
          <span className="font-mono text-gray-300">{Math.round(percentage)}%</span>
        </div>
      )}

      <div className={`relative overflow-hidden rounded-full border border-gray-700/50 bg-gray-900/80 backdrop-blur-md ${heightClass}`}>
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />

        <div className={`absolute inset-0 flex items-center justify-center px-2 font-mono ${textClass} text-white/90`}>
          <span className="drop-shadow-sm">
            {Math.round(percentage)}% · {formatCompact(used)}/{formatCompact(safeMax)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ContextPressureMeter;
