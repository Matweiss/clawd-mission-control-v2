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
      note?: string;
      error?: string;
      lastSuccessfulUpdate?: string;
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

function candidatePaths() {
  return [
    path.join(process.cwd(), 'data', 'schedule-current.json'),
    path.join(process.cwd(), 'memory', 'data', 'schedule-current.json'),
    path.join(process.cwd(), '..', 'memory', 'data', 'schedule-current.json'),
  ];
}

function readSnapshotFile(): ScheduleSnapshot | null {
  for (const filePath of candidatePaths()) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ScheduleSnapshot;
    }
  }
  return null;
}

function dayHasClasses(day: ScheduleSnapshot['yoga']['days'][number]) {
  return day.studios.some((studio) => studio.classes.length > 0);
}

function normalizeYogaSnapshot(snapshot: ScheduleSnapshot): ScheduleSnapshot {
  const yogaDays = snapshot.yoga?.days || [];
  const daysWithClasses = yogaDays.filter(dayHasClasses);
  const emptyDays = yogaDays.filter((day) => !dayHasClasses(day));
  const errorText = snapshot.sources.corepower.error || '';
  const hasBrowserFailure = /disconnected|offline|blocked|failed|refused|unreachable/i.test(errorText);

  if (hasBrowserFailure) {
    snapshot.yoga.confidence = 'low';
    snapshot.yoga.freshness = 'stale';
  } else if (daysWithClasses.length === 0) {
    snapshot.yoga.confidence = 'low';
    snapshot.yoga.freshness = 'stale';
    snapshot.sources.corepower.error = snapshot.sources.corepower.error || 'No CorePower classes loaded in current snapshot';
  } else if (emptyDays.length > 0) {
    snapshot.yoga.confidence = snapshot.yoga.confidence === 'high' ? 'medium' : snapshot.yoga.confidence;
    if (snapshot.yoga.freshness === 'fresh') snapshot.yoga.freshness = 'mixed';
    if (!snapshot.sources.corepower.note) {
      snapshot.sources.corepower.note = `Partial CorePower coverage: ${emptyDays.length} day(s) in the current window have zero classes.`;
    }
  }

  return snapshot;
}

export function loadScheduleSnapshot(): ScheduleSnapshot | null {
  const snapshot = readSnapshotFile();
  if (!snapshot) return null;
  return normalizeYogaSnapshot(snapshot);
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
