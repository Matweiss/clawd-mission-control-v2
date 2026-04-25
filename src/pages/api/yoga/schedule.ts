import type { NextApiRequest, NextApiResponse } from 'next';
import { buildDataQuality, completeSource, partialSource, unavailableSource } from '../../../lib/data-quality';
import { loadScheduleSnapshot } from '../../../lib/schedule-data';

const CLASS_TYPES = {
  C2: { name: 'CorePower Yoga 2', level: 'Intermediate' },
  C3: { name: 'CorePower Yoga 3', level: 'Advanced' },
  YS: { name: 'Yoga Sculpt', level: 'All Levels' },
  CSX: { name: 'CorePower Strength X', level: 'Intermediate' },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const snapshot = loadScheduleSnapshot();
  if (!snapshot) {
    return res.status(500).json({
      error: 'Schedule snapshot not found',
      dataQuality: buildDataQuality({
        sources: [unavailableSource('CorePower schedule snapshot', 'Schedule snapshot file is missing or unreadable.')],
      }),
    });
  }

  const requestedKey = String(req.query.day || '').toLowerCase();
  const activeDay = snapshot.yoga.days.find((d) => d.key === requestedKey) || snapshot.yoga.days[0];

  const studios = activeDay.studios.map((studio) => ({
    ...studio,
    count: studio.classes.length,
  }));
  const totalClasses = studios.reduce((sum, studio) => sum + studio.classes.length, 0);
  const hasSourceError = Boolean(snapshot.sources.corepower.error);
  const dataQuality = buildDataQuality({
    sources: [
      hasSourceError
        ? partialSource('CorePower extraction', snapshot.sources.corepower.error || 'CorePower extraction reported an error.')
        : completeSource('CorePower extraction'),
      totalClasses > 0
        ? completeSource('Yoga class inventory', `${totalClasses} classes loaded for ${activeDay.label}.`)
        : partialSource('Yoga class inventory', `No classes loaded for ${activeDay.label}.`, { expected: 1, received: 0 }),
      snapshot.yoga.freshness === 'fresh'
        ? completeSource('Yoga freshness', `Freshness is ${snapshot.yoga.freshness}.`)
        : partialSource('Yoga freshness', `Freshness is ${snapshot.yoga.freshness}; verify before relying on this schedule.`),
    ],
  });

  return res.status(200).json({
    source: snapshot.sources.corepower.name,
    sourceType: snapshot.sources.corepower.sourceType,
    confidence: snapshot.yoga.confidence,
    freshness: snapshot.yoga.freshness,
    studioFocus: snapshot.sources.corepower.filter,
    activeDay: activeDay.key,
    date: activeDay.date,
    days: snapshot.yoga.days.map((d) => ({
      key: d.key,
      label: d.label,
      date: d.date,
      totalClasses: d.studios.reduce((sum, studio) => sum + studio.classes.length, 0),
    })),
    studios,
    classTypes: CLASS_TYPES,
    preferredClasses: ['C2', 'C3', 'YS', 'CSX'],
    totalClasses,
    lastUpdated: snapshot.yoga.lastUpdated,
    sourceNote:
      snapshot.sources.corepower.note ||
      `Live browser extraction using ${snapshot.sources.corepower.filter} filter (${snapshot.sources.corepower.studios.join(', ')})`,
    sourceError: snapshot.sources.corepower.error || null,
    dataQuality,
  });
}
