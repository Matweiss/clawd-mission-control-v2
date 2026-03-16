import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function CardSkeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}
        >
          {/* Header skeleton */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shimmer className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <Shimmer className="w-24 h-4 rounded" />
                <Shimmer className="w-16 h-3 rounded" />
              </div>
            </div>
            <Shimmer className="w-12 h-4 rounded" />
          </div>
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <Shimmer className="w-full h-8 rounded-lg" />
            <Shimmer className="w-3/4 h-8 rounded-lg" />
            <Shimmer className="w-1/2 h-8 rounded-lg" />
          </div>
        </motion.div>
      ))}
    </>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Shimmer className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Shimmer className="w-32 h-5 rounded" />
          <Shimmer className="w-48 h-4 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function AgentCardSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Shimmer className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Shimmer className="w-24 h-4 rounded" />
              <Shimmer className="w-32 h-3 rounded" />
            </div>
            <Shimmer className="w-8 h-8 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}

export function EmailListSkeleton({ count = 3 }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-light rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Shimmer className="w-24 h-3 rounded" />
            <Shimmer className="w-12 h-3 rounded" />
          </div>
          <Shimmer className="w-full h-4 rounded mb-1" />
          <Shimmer className="w-3/4 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-light ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
      />
    </div>
  );
}
