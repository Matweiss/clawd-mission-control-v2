// Siri Shortcuts integration for iOS Mission Control
// Uses the Shortcuts URL scheme and Universal Links

interface ShortcutAction {
  name: string;
  phrase: string;
  url: string;
  icon: string;
}

export const SIRI_SHORTCUTS: ShortcutAction[] = [
  {
    name: 'Check Movies',
    phrase: 'What\'s playing at the movies',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=movies',
    icon: '🎬'
  },
  {
    name: 'Check Yoga',
    phrase: 'What yoga classes are available',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=yoga',
    icon: '🧘'
  },
  {
    name: 'Book Yoga',
    phrase: 'Book yoga class',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=book-yoga',
    icon: '💪'
  },
  {
    name: 'Log Yoga',
    phrase: 'Log my yoga session',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=log-yoga',
    icon: '🔥'
  },
  {
    name: 'Home Status',
    phrase: 'Check my home status',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=home',
    icon: '🏠'
  },
  {
    name: 'Lock Door',
    phrase: 'Lock the front door',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=lock-door',
    icon: '🔒'
  },
  {
    name: 'Check Work',
    phrase: 'Check my work dashboard',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=work',
    icon: '💼'
  },
  {
    name: 'Movie at Time',
    phrase: 'What\'s playing around 7 PM',
    url: 'https://clawd-mission-control-v2.vercel.app/mobile?action=movies-at-time',
    icon: '🍿'
  }
];

/**
 * Generate a Shortcuts URL to create a new shortcut
 */
export function generateShortcutURL(action: ShortcutAction): string {
  // Shortcuts URL scheme for creating a new shortcut
  const shortcutData = {
    name: action.name,
    actions: [
      {
        type: 'openURL',
        url: action.url
      }
    ]
  };
  
  const encoded = encodeURIComponent(JSON.stringify(shortcutData));
  return `shortcuts://create-shortcut?data=${encoded}`;
}

/**
 * Open the Shortcuts app to create a shortcut
 */
export function openShortcutsApp(action: ShortcutAction): void {
  const url = generateShortcutURL(action);
  window.location.href = url;
}

/**
 * Check if Shortcuts app is available (iOS only)
 */
export function isShortcutsAvailable(): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS;
}

/**
 * Handle incoming shortcut actions from URL params
 */
export function handleShortcutAction(): { action: string; params: Record<string, string> } | null {
  if (typeof window === 'undefined') return null;
  
  const url = new URL(window.location.href);
  const action = url.searchParams.get('action');
  
  if (!action) return null;
  
  // Extract all params
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (key !== 'action') {
      params[key] = value;
    }
  });
  
  return { action, params };
}

/**
 * Execute shortcut action and return navigation info
 */
export function executeShortcutAction(action: string): { tab?: string; modal?: string; message?: string } {
  switch (action) {
    case 'movies':
      return { tab: 'movies' };
    case 'yoga':
      return { tab: 'yoga' };
    case 'book-yoga':
      return { tab: 'yoga', modal: 'book' };
    case 'log-yoga':
      return { tab: 'home', modal: 'yoga-log' };
    case 'home':
      return { tab: 'home' };
    case 'lock-door':
      return { tab: 'home', message: 'Locking front door...' };
    case 'work':
      return { tab: 'work' };
    case 'movies-at-time':
      return { tab: 'movies', modal: 'time-filter' };
    default:
      return { tab: 'home' };
  }
}

/**
 * Generate Shortcuts installation guide
 */
export function generateShortcutsGuide(): string {
  return `
How to set up Siri Shortcuts:

1. Open the "More" tab in Mission Control
2. Tap "Setup Siri Shortcuts"
3. Tap each shortcut you want to add
4. In the Shortcuts app, tap "Add Shortcut"
5. Record your voice phrase

Available phrases:
${SIRI_SHORTCUTS.map(s => `• "${s.phrase}"`).join('\n')}

You can also say:
• "Hey Siri, check movies"
• "Hey Siri, book yoga"
• "Hey Siri, log yoga"
• "Hey Siri, lock the door"
  `.trim();
}
