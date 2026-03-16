import { useState, useRef, useCallback, useEffect } from 'react';

interface SwipeConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function useSwipe(config: SwipeConfig = {}) {
  const { 
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  } = config;
  
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.isDragging) return;
    
    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  }, [swipeState.isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = swipeState.currentY - swipeState.startY;
    
    // Check horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    // Check vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
    
    setSwipeState(prev => ({ ...prev, isDragging: false }));
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const translateX = swipeState.isDragging 
    ? swipeState.currentX - swipeState.startX 
    : 0;

  return {
    ref: elementRef,
    translateX,
    isDragging: swipeState.isDragging,
  };
}

// Hook for swipeable list items (like email archive)
export function useSwipeableItem({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { ref, translateX, isDragging } = useSwipe({
    threshold: threshold / 2,
    onSwipeLeft: () => {
      setIsOpen(true);
      onSwipeLeft?.();
    },
    onSwipeRight: () => {
      setIsOpen(false);
      onSwipeRight?.();
    },
  });

  return {
    ref,
    translateX: isOpen ? -threshold : Math.min(0, translateX),
    isDragging,
    isOpen,
    setIsOpen,
  };
}
