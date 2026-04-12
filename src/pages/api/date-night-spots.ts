import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Visit {
  date: string;
  rating: number;
  notes?: string;
}

interface Spot {
  id: string;
  name: string;
  neighborhood: string;
  category: string;
  vibe: string;
  price: '$' | '$$' | '$$$' | '$$$$';
  lastSuggestedAt?: string;
  createdAt: string;
  visits: Visit[];
}

interface DateNightData {
  spots: Spot[];
}

const dataPath = path.join(process.cwd(), 'data', 'date-night-spots.json');

const seedData: DateNightData = {
  spots: [
    {
      id: 'osteria-la-buca',
      name: 'Osteria La Buca',
      neighborhood: 'Sherman Oaks',
      category: 'Dinner',
      vibe: 'Cozy pasta spot',
      price: '$$$',
      createdAt: new Date().toISOString(),
      lastSuggestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      visits: [
        { date: '2026-03-22', rating: 5, notes: 'Easy win, keep in rotation.' }
      ]
    },
    {
      id: 'mizlala',
      name: 'Mizlala',
      neighborhood: 'Sherman Oaks',
      category: 'Dinner',
      vibe: 'Casual, lively, shareable plates',
      price: '$$',
      createdAt: new Date().toISOString(),
      lastSuggestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      visits: [
        { date: '2026-02-14', rating: 4, notes: 'Good energy, solid fallback.' }
      ]
    },
    {
      id: 'uji-time',
      name: 'Uji Time',
      neighborhood: 'Studio City',
      category: 'Dessert',
      vibe: 'Short sweet stop',
      price: '$$',
      createdAt: new Date().toISOString(),
      visits: []
    }
  ]
};

function ensureDataFile() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify(seedData, null, 2));
}

function readData(): DateNightData {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataPath, 'utf8')) as DateNightData;
}

function writeData(data: DateNightData) {
  ensureDataFile();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getRotation(spots: Spot[]) {
  return [...spots]
    .sort((a, b) => {
      const aVisits = a.visits.length;
      const bVisits = b.visits.length;
      if (aVisits === 0 && bVisits > 0) return -1;
      if (bVisits === 0 && aVisits > 0) return 1;

      const aSuggested = a.lastSuggestedAt ? new Date(a.lastSuggestedAt).getTime() : 0;
      const bSuggested = b.lastSuggestedAt ? new Date(b.lastSuggestedAt).getTime() : 0;
      if (aSuggested !== bSuggested) return aSuggested - bSuggested;

      const aRating = a.visits.length ? a.visits.reduce((sum, v) => sum + v.rating, 0) / a.visits.length : 0;
      const bRating = b.visits.length ? b.visits.reduce((sum, v) => sum + v.rating, 0) / b.visits.length : 0;
      return bRating - aRating;
    })
    .slice(0, 3);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = readData();

    if (req.method === 'GET') {
      return res.status(200).json({
        spots: data.spots,
        rotation: getRotation(data.spots),
      });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};

      if (action === 'addSpot') {
        const { name, neighborhood, category, vibe, price } = req.body;
        if (!name || !neighborhood || !category || !vibe || !price) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (data.spots.some((spot) => spot.id === id)) {
          return res.status(400).json({ error: 'Spot already exists' });
        }

        data.spots.unshift({
          id,
          name,
          neighborhood,
          category,
          vibe,
          price,
          createdAt: new Date().toISOString(),
          visits: [],
        });
        writeData(data);
        return res.status(200).json({ spots: data.spots, rotation: getRotation(data.spots) });
      }

      if (action === 'logVisit') {
        const { spotId, rating, notes } = req.body;
        const spot = data.spots.find((entry) => entry.id === spotId);
        if (!spot) return res.status(404).json({ error: 'Spot not found' });
        spot.visits.unshift({ date: new Date().toISOString().slice(0, 10), rating: Number(rating || 0), notes });
        spot.lastSuggestedAt = new Date().toISOString();
        writeData(data);
        return res.status(200).json({ spots: data.spots, rotation: getRotation(data.spots) });
      }

      if (action === 'rotateSuggestion') {
        const { spotId } = req.body;
        const spot = data.spots.find((entry) => entry.id === spotId);
        if (!spot) return res.status(404).json({ error: 'Spot not found' });
        spot.lastSuggestedAt = new Date().toISOString();
        writeData(data);
        return res.status(200).json({ spots: data.spots, rotation: getRotation(data.spots) });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('date-night-spots error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
