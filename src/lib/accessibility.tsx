// Accessibility utilities and helpers

import { useEffect, useRef } from 'react';

// Focus trap for modals/drawers
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

// Skip link for keyboard navigation
export function SkipLink({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-work focus:text-white focus:rounded-lg"
    >
      Skip to main content
    </a>
  );
}

// Visually hidden but accessible
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </span>
  );
}

// Reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Accessibility audit checklist
export const ACCESSIBILITY_CHECKLIST = {
  // Keyboard Navigation
  keyboard: [
    'All interactive elements are keyboard accessible',
    'Tab order follows visual order',
    'Focus indicators are visible',
    'No keyboard traps',
    'Escape key closes modals/drawers',
  ],
  
  // Screen Readers
  screenReaders: [
    'Images have alt text',
    'Form inputs have labels',
    'Headings are properly nested (h1 > h2 > h3)',
    'ARIA labels used appropriately',
    'Status updates announced to screen readers',
  ],
  
  // Visual
  visual: [
    'Color contrast meets WCAG AA (4.5:1 for text)',
    'Text is resizable up to 200%',
    'Content is readable at 320px width',
    'Focus indicators have 3:1 contrast ratio',
    'No content relies solely on color',
  ],
  
  // Motion
  motion: [
    'Respects prefers-reduced-motion',
    'No auto-playing content without pause control',
    'No flashing content (>3 flashes per second)',
  ],
};

// Keyboard shortcut help
export const KEYBOARD_SHORTCUTS = {
  global: [
    { key: '?', action: 'Show keyboard shortcuts' },
    { key: 'Esc', action: 'Close modals/drawers' },
    { key: 'Tab', action: 'Navigate to next element' },
    { key: 'Shift+Tab', action: 'Navigate to previous element' },
  ],
  navigation: [
    { key: 'G then Y', action: 'Go to Yoga' },
    { key: 'G then M', action: 'Go to Movies' },
    { key: 'G then E', action: 'Go to Emails' },
    { key: 'G then C', action: 'Go to Calendar' },
  ],
  actions: [
    { key: 'R', action: 'Refresh data' },
    { key: 'F', action: 'Feed Theo' },
    { key: 'L', action: 'Lock it down' },
    { key: 'P', action: 'Toggle Priority mode' },
    { key: 'N', action: 'Open Notifications' },
  ],
};
