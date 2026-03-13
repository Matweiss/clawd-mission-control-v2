import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeableContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
}

const SWIPE_THRESHOLD = 100;

export function SwipeableContainer({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  enabled = true 
}: SwipeableContainerProps) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const rotate = useTransform(x, [-200, 0, 200], [-5, 0, 5]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!enabled) return;
    
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      onSwipeRight?.();
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      onSwipeLeft?.();
    }
  };

  return (
    <motion.div
      style={{ x, opacity, rotate }}
      drag={enabled ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        handleDragEnd(e, info);
      }}
      className="touch-pan-y"
    >
      {children}
    </motion.div>
  );
}

// Hook for swipe navigation between tabs
export function useSwipeNavigation(
  tabs: string[],
  activeTab: string,
  onTabChange: (tab: string) => void
) {
  const activeIndex = tabs.indexOf(activeTab);

  const swipeLeft = () => {
    if (activeIndex < tabs.length - 1) {
      onTabChange(tabs[activeIndex + 1]);
    }
  };

  const swipeRight = () => {
    if (activeIndex > 0) {
      onTabChange(tabs[activeIndex - 1]);
    }
  };

  return { swipeLeft, swipeRight };
}

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  refreshing?: boolean;
}

export function PullToRefresh({ onRefresh, children, refreshing }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      if (diff > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(diff * 0.5, 120));
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        onRefresh();
      }
      setPullDistance(0);
      setIsPulling(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, onRefresh]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10"
        animate={{ y: pullDistance > 80 ? 20 : pullDistance * 0.5 - 40 }}
      >
        <div className={`w-10 h-10 rounded-full bg-surface-light flex items-center justify-center shadow-lg transition-transform ${
          pullDistance > 80 ? 'rotate-180' : ''
        }`}
        style={{ transform: `rotate(${pullDistance * 1.5}deg)` }}
        >
          {refreshing ? (
            <div className="w-5 h-5 border-2 border-work border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-work" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ 
          y: pullDistance * 0.3,
          scale: pullDistance > 0 ? 0.98 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
