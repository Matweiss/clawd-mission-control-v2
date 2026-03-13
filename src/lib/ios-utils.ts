// iOS-specific utilities for Mission Control Mobile

/**
 * Trigger haptic feedback on iOS devices
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  if (typeof window === 'undefined') return;
  
  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!isIOS) return;

  // Use the Haptic Feedback API if available
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [30, 50, 30],
      warning: [20, 50, 20]
    };
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Check if app is running as installed PWA on iOS
 */
export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return isIOS && isStandalone;
}

/**
 * Request iOS notification permissions
 */
export async function requestIOSNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Schedule a local notification (for iOS)
 * Note: This uses the Push API which requires service worker
 */
export async function scheduleNotification(
  title: string,
  options: { body?: string; delay?: number; tag?: string; url?: string }
): Promise<void> {
  const { body = '', delay = 0, tag = 'default', url = '/mobile' } = options;
  
  if (!('serviceWorker' in navigator)) return;
  
  const registration = await navigator.serviceWorker.ready;
  
  // Use setTimeout for delayed notifications
  setTimeout(() => {
    registration.showNotification(title, {
      body,
      tag,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url },
      requireInteraction: false,
      // iOS-specific options
      silent: false,
    });
  }, delay);
}

/**
 * Smart suggestions based on context
 */
export function getSmartSuggestions(
  yogaClasses: any[],
  movies: any[],
  currentTime: Date = new Date()
): string[] {
  const suggestions: string[] = [];
  const hour = currentTime.getHours();
  
  // Yoga suggestions
  const upcomingYoga = yogaClasses.find(c => {
    const classHour = parseInt(c.time.split(':')[0]);
    const isPM = c.time.includes('PM');
    const class24Hour = isPM && classHour !== 12 ? classHour + 12 : classHour;
    return class24Hour > hour && class24Hour <= hour + 2;
  });
  
  if (upcomingYoga) {
    suggestions.push(`🧘 ${upcomingYoga.name} at ${upcomingYoga.time} - book now?`);
  }
  
  // Movie suggestions (evening)
  if (hour >= 17) {
    const eveningMovies = movies.filter(m => 
      m.showtimes.some((t: string) => t.includes('7:') || t.includes('8:') || t.includes('9:'))
    );
    if (eveningMovies.length > 0) {
      suggestions.push(`🎬 ${eveningMovies[0].title} playing tonight`);
    }
  }
  
  return suggestions;
}
