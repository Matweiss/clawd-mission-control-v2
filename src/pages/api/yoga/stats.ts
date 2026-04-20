import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { loadScheduleSnapshot, formatDateLabel } from '../../../lib/schedule-data';

interface YogaClass {
  date: string;
  classType: string;
  teacher: string;
  time: string;
  location: string;
}

function loadRecentHistory(): YogaClass[] {
  const logPath = path.join(process.cwd(), 'memory', 'logs', '2026-03-16-corepower-yoga-history.md');
  if (!fs.existsSync(logPath)) return [];
  const content = fs.readFileSync(logPath, 'utf8');
  const tableMatch = content.match(/\| Date \| Class \| Teacher \| Time \| Location \|[\s\S]+?(?=\n\n|\n##)/);
  if (!tableMatch) return [];
  return tableMatch[0]
    .split('\n')
    .slice(2)
    .filter((line) => line.startsWith('|'))
    .map((line) => {
      const parts = line.split('|').filter((p) => p.trim());
      return {
        date: parts[0]?.trim() || '',
        classType: parts[1]?.trim() || '',
        teacher: parts[2]?.trim() || '',
        time: parts[3]?.trim() || '',
        location: parts[4]?.trim() || 'Encino',
      };
    })
    .filter((c) => c.classType);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const snapshot = loadScheduleSnapshot();
    const recentClasses = loadRecentHistory().slice(0, 5);
    const todayPT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date()); // YYYY-MM-DD
    const yogaDays = snapshot?.yoga.days || [];
    const upcomingWindow = yogaDays.filter((d) => d.date >= todayPT).slice(0, 3);
    const fallbackWindow = upcomingWindow.length ? upcomingWindow : yogaDays.slice(0, 3);

    const upcomingClasses = snapshot
      ? fallbackWindow.flatMap((day) =>
          day.studios.flatMap((studio) =>
            studio.classes.map((cls) => ({
              day: day.label,
              date: formatDateLabel(day.date),
              time: cls.time,
              classType: cls.className,
              teacher: cls.teacher || '',
              location: studio.name,
            }))
          )
        )
      : [];

    return res.status(200).json({
      totalClasses: 51,
      studioClasses: 50,
      liveClasses: 1,
      recentClasses,
      upcomingClasses,
      buddyPasses: 2,
      buddyPassExpiry: '2026-04-01',
      completedChallenge: 'Live Your Power Challenge (Jan 2026)',
      confidence: snapshot?.yoga.confidence || 'medium',
      freshness: snapshot?.yoga.freshness || 'stale',
      lastUpdated: snapshot?.yoga.lastUpdated || new Date().toISOString(),
      sourceNote: snapshot?.sources.corepower.note || null,
      sourceError: snapshot?.sources.corepower.error || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Yoga data API error:', error);
    return res.status(500).json({ error: 'Failed to fetch yoga data' });
  }
}
