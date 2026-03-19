import fs from 'fs';
import path from 'path';

export type ScheduleSnapshot = {
  updatedAt: string;
  window: { start: string; end: string; label: string };
  sources: {
    corepower: {
      name: string;
      filter: string;
      studios: string[];
      confidence: 'high' | 'medium' | 'low';
      sourceType: string;
    };
    regal: {
      name: string;
      url: string;
      confidence: 'high' | 'medium' | 'low';
      sourceType: string;
      notes?: string;
    };
  };
  yoga: {
    lastUpdated: string;
    freshness: string;
    confidence: 'high' | 'medium' | 'low';
    days: Array<{
      key: string;
      label: string;
      date: string;
      studios: Array<{
        name: string;
        classes: Array<{
          time: string;
          className: string;
          teacher?: string;
          status?: string;
        }>;
      }>;
    }>;
  };
  movies: {
    lastUpdated: string;
    freshness: string;
    confidence: 'high' | 'medium' | 'low';
    theater: string;
    schemaVersion?: number;
    days: Array<{
      key: string;
      label: string;
      date: string;
      strict?: boolean;
      movies: Array<{
        title: string;
        masterMovieCode?: string | null;
        formats?: Array<{
          format: string;
          showtimes: string[];
        }>;
        showtimes?: string[];
      }>;
    }>;
  };
};

export function loadScheduleSnapshot(): ScheduleSnapshot | null {
  const candidatePaths = [
    path.join(process.cwd(), 'memory', 'data', 'schedule-current.json'),
    path.join(process.cwd(), '..', 'memory', 'data', 'schedule-current.json'),
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ScheduleSnapshot;
    }
  }

  return null;
}

export function sortTimes(times: string[]) {
  return [...times].sort((a, b) => toMinutes(a) - toMinutes(b));
}

function toMinutes(value: string) {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let hour = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const meridiem = m[3].toLowerCase();
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return hour * 60 + mins;
}

export function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
