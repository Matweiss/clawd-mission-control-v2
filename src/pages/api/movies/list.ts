import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Movie {
  id: string;
  title: string;
  year: string;
  rating?: string;
  duration?: string;
  genre?: string[];
  status: 'watchlist' | 'watched' | 'recommended';
  addedAt: string;
  recommendedReason?: string;
  recommendedFor?: string; // ISO date string for when it's recommended
}

const MOVIES_FILE = path.join(process.cwd(), 'memory', 'data', 'movies.json');

function ensureDataDir() {
  const dir = path.join(process.cwd(), 'memory', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadMovies(): Movie[] {
  ensureDataDir();
  if (!fs.existsSync(MOVIES_FILE)) {
    // Seed with some recommendations
    const seedMovies: Movie[] = [
      {
        id: '1',
        title: 'Dune: Part Two',
        year: '2024',
        duration: '2h 46m',
        genre: ['Sci-Fi', 'Action'],
        status: 'recommended',
        addedAt: new Date().toISOString(),
        recommendedReason: 'Perfect for Sunday evening',
        recommendedFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
      {
        id: '2',
        title: 'The Bear S3',
        year: '2024',
        duration: '45m episodes',
        genre: ['Drama'],
        status: 'recommended',
        addedAt: new Date().toISOString(),
        recommendedReason: '30 min free before yoga',
        recommendedFor: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(MOVIES_FILE, JSON.stringify(seedMovies, null, 2));
    return seedMovies;
  }
  return JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf8'));
}

function saveMovies(movies: Movie[]) {
  ensureDataDir();
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const movies = loadMovies();
      return res.status(200).json({ movies });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to load movies' });
    }
  }

  if (req.method === 'POST') {
    try {
      const movies = loadMovies();
      const newMovie: Movie = {
        id: Date.now().toString(),
        ...req.body,
        addedAt: new Date().toISOString(),
      };
      movies.push(newMovie);
      saveMovies(movies);
      return res.status(200).json({ movie: newMovie });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to add movie' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const movies = loadMovies();
      const { id, ...updates } = req.body;
      const index = movies.findIndex(m => m.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      movies[index] = { ...movies[index], ...updates };
      saveMovies(movies);
      return res.status(200).json({ movie: movies[index] });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update movie' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
