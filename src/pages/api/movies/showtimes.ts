import type { NextApiRequest, NextApiResponse } from 'next';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;

// Regal Sherman Oaks Galleria coordinates
const THEATER_LAT = 34.1508;
const THEATER_LON = -118.4485;

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  showtimes?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
  }

  try {
    // Get now playing movies
    const nowPlayingUrl = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1&region=US`;
    
    const response = await fetch(nowPlayingUrl, {
      headers: {
        'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Format movies with poster URLs
    const movies: Movie[] = data.results.slice(0, 10).map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : null,
      release_date: movie.release_date,
      vote_average: Math.round(movie.vote_average * 10) / 10,
      overview: movie.overview?.substring(0, 150) + '...' || 'No description available'
    }));

    return res.status(200).json({
      theater: 'Regal Sherman Oaks Galleria',
      location: { lat: THEATER_LAT, lon: THEATER_LON },
      movies,
      count: movies.length,
      lastUpdated: new Date().toISOString(),
      source: 'TMDB API'
    });

  } catch (error) {
    console.error('Movie API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch movies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
