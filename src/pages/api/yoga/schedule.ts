import type { NextApiRequest, NextApiResponse } from 'next';

const PREFERRED_CLASSES = ['C2', 'C3', 'YS', 'CSX'];

type YogaClass = { time: string; name: string; instructor: string; duration: string; type: string };
type StudioDay = { name: string; url: string; classes: YogaClass[] };
type DaySchedule = { key: 'sun' | 'mon'; label: string; date: string; studios: StudioDay[]; reportedTotalClasses?: number };

const YOGA_DATA: {
  source: string;
  studioFocus: string;
  classTypes: Record<string, { name: string; description: string; level: string }>;
  preferredClasses: string[];
  days: DaySchedule[];
  lastUpdated: string;
  sourceNote: string;
} = {
  source: 'CorePower Yoga',
  studioFocus: 'Encino',
  classTypes: {
    C2: { name: 'CorePower Yoga 2', description: 'Intermediate heated yoga', level: 'Intermediate' },
    C3: { name: 'CorePower Yoga 3', description: 'Advanced heated yoga', level: 'Advanced' },
    YS: { name: 'Yoga Sculpt', description: 'Yoga + weights + cardio', level: 'All Levels' },
    CSX: { name: 'CorePower Strength X', description: 'Strength training', level: 'Intermediate' },
    HPF: { name: 'Hot Power Fusion', description: 'Heated vinyasa + holds', level: 'All Levels' },
    CR: { name: 'CoreRestore', description: 'Restorative candlelight flow', level: 'All Levels' },
    C15: { name: 'CorePower Yoga 1.5', description: 'Bridge between C1 and C2', level: 'Beginner-Intermediate' }
  },
  preferredClasses: PREFERRED_CLASSES,
  days: [
    {
      key: 'sun',
      label: 'Sun',
      date: '2026-03-15',
      reportedTotalClasses: 10,
      studios: [
        {
          name: 'Sherman Oaks',
          url: 'https://www.corepoweryoga.com/yoga-schedules',
          classes: [
            { time: '10:00 AM', name: 'C3 - CorePower Yoga 3 (75)', instructor: 'Megan M', duration: '75 min', type: 'C3' },
            { time: '12:30 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Aliza P', duration: '60 min', type: 'C2' },
            { time: '3:00 PM', name: 'Free Community Flow Class (heated)', instructor: 'Joshua S', duration: '60 min', type: 'C2' },
            { time: '6:00 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Erin H', duration: '60 min', type: 'C2' }
          ]
        },
        {
          name: 'Encino',
          url: 'https://www.corepoweryoga.com/yoga-schedules',
          classes: [
            { time: '8:00 AM', name: 'C2 - CorePower Yoga 2', instructor: 'Shella M', duration: '60 min', type: 'C2' },
            { time: '9:00 AM', name: 'HPF - Hot Power Fusion', instructor: 'Chloe B', duration: '60 min', type: 'HPF' },
            { time: '9:30 AM', name: 'C2 - CorePower Yoga 2', instructor: 'Shella M', duration: '60 min', type: 'C2' },
            { time: '10:30 AM', name: 'YS - Yoga Sculpt (75)', instructor: 'Gabriella D', duration: '75 min', type: 'YS' },
            { time: '11:00 AM', name: 'Free Community Flow Class', instructor: 'Nicole L', duration: '60 min', type: 'C2' },
            { time: '12:15 PM', name: 'YS - Yoga Sculpt', instructor: 'Gabriella D', duration: '60 min', type: 'YS' },
            { time: '12:30 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Chloe B', duration: '60 min', type: 'C2' },
            { time: '3:00 PM', name: 'YS - Yoga Sculpt', instructor: 'Linnie S', duration: '60 min', type: 'YS' },
            { time: '4:30 PM', name: 'YS - Yoga Sculpt', instructor: 'Linnie S', duration: '60 min', type: 'YS' }
          ]
        }
      ]
    },
    {
      key: 'mon',
      label: 'Mon',
      date: '2026-03-16',
      reportedTotalClasses: 21,
      studios: [
        {
          name: 'Sherman Oaks',
          url: 'https://www.corepoweryoga.com/yoga-schedules',
          classes: [
            { time: '7:00 AM', name: 'YS - Yoga Sculpt', instructor: 'Mara C', duration: '60 min', type: 'YS' },
            { time: '7:30 AM', name: 'C2 - CorePower Yoga 2', instructor: 'Madison M', duration: '60 min', type: 'C2' },
            { time: '9:00 AM', name: 'YS - Yoga Sculpt', instructor: 'Laura F', duration: '60 min', type: 'YS' },
            { time: '10:00 AM', name: 'C2 - CorePower Yoga 2', instructor: 'Jennifer R', duration: '60 min', type: 'C2' },
            { time: '12:30 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Madison M', duration: '60 min', type: 'C2' }
          ]
        },
        {
          name: 'Encino',
          url: 'https://www.corepoweryoga.com/yoga-schedules',
          classes: [
            { time: '6:30 AM', name: 'YS - Yoga Sculpt', instructor: 'Gabriella D', duration: '60 min', type: 'YS' },
            { time: '8:45 AM', name: 'HPF - Hot Power Fusion 75', instructor: 'Maxwell Sp', duration: '75 min', type: 'HPF' },
            { time: '9:30 AM', name: 'C2 - CorePower Yoga 2', instructor: 'Tatiana C', duration: '60 min', type: 'C2' },
            { time: '10:30 AM', name: 'YS - Yoga Sculpt', instructor: 'Maxwell Sp', duration: '60 min', type: 'YS' },
            { time: '11:00 AM', name: 'C1.5 - CorePower Yoga 1.5', instructor: 'Tatiana C', duration: '60 min', type: 'C15' },
            { time: '12:00 PM', name: 'YS - Yoga Sculpt', instructor: 'Adrian A', duration: '60 min', type: 'YS' },
            { time: '12:30 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Nicole L', duration: '60 min', type: 'C2' },
            { time: '3:00 PM', name: 'YS - Yoga Sculpt', instructor: 'Danielle W', duration: '60 min', type: 'YS' },
            { time: '4:00 PM', name: 'C2 - CorePower Yoga 2', instructor: 'Toni S', duration: '60 min', type: 'C2' },
            { time: '4:30 PM', name: 'CSX - CorePower Strength X', instructor: 'Janelle P', duration: '60 min', type: 'CSX' },
            { time: '5:30 PM', name: 'YS - Yoga Sculpt', instructor: 'Anna J', duration: '60 min', type: 'YS' },
            { time: '6:00 PM', name: 'HPF - Hot Power Fusion', instructor: 'Toni S', duration: '60 min', type: 'HPF' },
            { time: '7:30 PM', name: 'YS - Yoga Sculpt', instructor: 'Anna J', duration: '60 min', type: 'YS' },
            { time: '9:00 PM', name: 'CR - CoreRestore Candlelight', instructor: 'Lisa Jo', duration: '60 min', type: 'CR' }
          ]
        }
      ]
    }
  ],
  lastUpdated: '2026-03-15T17:50:00Z',
  sourceNote: 'Pulled from live logged-in CorePower browser tab using favorited filter "Main" (Filter 2), Sunday + Monday.'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const dayParam = String(req.query.day || '').toLowerCase();
    const requestedDay = dayParam.startsWith('mon') ? 'mon' : 'sun';
    const activeDay = YOGA_DATA.days.find((d) => d.key === requestedDay) || YOGA_DATA.days[0];

    const studios = activeDay.studios.map((studio) => ({
      ...studio,
      count: studio.classes.length
    }));

    const daySummaries = YOGA_DATA.days.map((d) => ({
      key: d.key,
      label: d.label,
      date: d.date,
      totalClasses: d.reportedTotalClasses ?? d.studios.reduce((acc, s) => acc + s.classes.length, 0)
    }));

    return res.status(200).json({
      source: YOGA_DATA.source,
      date: activeDay.date,
      activeDay: activeDay.key,
      days: daySummaries,
      studios,
      classTypes: YOGA_DATA.classTypes,
      preferredClasses: YOGA_DATA.preferredClasses,
      totalClasses: activeDay.reportedTotalClasses ?? studios.reduce((acc, s) => acc + s.classes.length, 0),
      lastUpdated: YOGA_DATA.lastUpdated,
      sourceNote: YOGA_DATA.sourceNote
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch yoga schedule', details: (error as Error).message });
  }
}
