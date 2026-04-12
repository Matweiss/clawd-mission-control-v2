import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type Priority = 'high' | 'medium' | 'low';

type Collector = {
  name: string;
  segment: string;
  lifetimeOrders: number;
  lifetimeSpend: number;
  lastPurchaseDate: string;
  lastTouchDate?: string;
  favoriteThemes?: string[];
  notes?: string;
  reasons?: string[];
  recommendedAction?: string;
  priority: Priority;
};

type RadarSnapshot = {
  lastUpdated: string;
  collectors: Collector[];
};

type RadarCollector = Collector & {
  daysSincePurchase: number | null;
  daysSinceTouch: number | null;
  score: number;
};

const FALLBACK: RadarSnapshot = {
  lastUpdated: '2026-04-12',
  collectors: [],
};

function loadSnapshot(): RadarSnapshot {
  const candidates = [
    path.resolve(process.cwd(), 'src', 'data', 'collector-reengagement-radar.json'),
    path.resolve(process.cwd(), '..', 'shared', 'sarah-agent', 'projects', 'collector-reengagement-radar.json'),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as RadarSnapshot;
    } catch (error) {
      console.error('Failed to parse collector radar snapshot', filePath, error);
    }
  }

  return FALLBACK;
}

function daysSince(date?: string) {
  if (!date) return null;
  const ts = new Date(date).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

function scoreCollector(collector: Collector) {
  const daysSincePurchase = daysSince(collector.lastPurchaseDate);
  const daysSinceTouch = daysSince(collector.lastTouchDate);

  let score = 0;
  score += collector.priority === 'high' ? 35 : collector.priority === 'medium' ? 20 : 10;
  score += Math.min(collector.lifetimeOrders * 4, 28);
  score += Math.min(Math.floor(collector.lifetimeSpend / 250), 24);
  score += daysSincePurchase ? Math.min(Math.floor(daysSincePurchase / 10), 20) : 0;
  score += daysSinceTouch ? Math.min(Math.floor(daysSinceTouch / 14), 12) : 0;

  return {
    ...collector,
    daysSincePurchase,
    daysSinceTouch,
    score,
  } satisfies RadarCollector;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const snapshot = loadSnapshot();
    const collectors = snapshot.collectors.map(scoreCollector).sort((a, b) => b.score - a.score);

    const totals = {
      totalCollectors: collectors.length,
      highPriority: collectors.filter((c) => c.priority === 'high').length,
      vipAtRisk: collectors.filter((c) => c.segment.toLowerCase() === 'vip').length,
      avgDaysSincePurchase: collectors.length
        ? Math.round(
            collectors.reduce((sum, collector) => sum + (collector.daysSincePurchase || 0), 0) / collectors.length
          )
        : 0,
    };

    return res.status(200).json({
      lastUpdated: snapshot.lastUpdated,
      totals,
      collectors,
      topRecommendation: collectors[0]?.recommendedAction || null,
    });
  } catch (error) {
    console.error('Collector re-engagement API error:', error);
    return res.status(500).json({ error: 'Failed to load collector re-engagement radar' });
  }
}
