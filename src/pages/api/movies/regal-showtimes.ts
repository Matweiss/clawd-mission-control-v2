import type { NextApiRequest, NextApiResponse } from 'next';

// This would be populated by scraping Regal's website
// For now, returning placeholder data

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  showtimes: string[];
  rating?: string;
}

// Placeholder data - would be scraped from Regal website
const REGAL_MOVIES: Movie[] = [
  // Example structure - would be populated by scrapling
  // {
  //   id: 12345,
  //   title: "Movie Title",
  //   poster_path: "https://image.tmdb.org/t/p/w200/...",
  //   showtimes: ["10:30 AM", "1:15 PM", "4:00 PM", "7:30 PM", "10:15 PM"],
  //   rating: "PG-13"
  // }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement Scrapling-based scraping here
    // For now, return empty array with instructions

    return res.status(200).json({
      theater: 'Regal Sherman Oaks Galleria',
      location: { 
        address: '15301 Ventura Blvd, Sherman Oaks, CA 91403',
        lat: 34.1508, 
        lon: -118.4485 
      },
      movies: REGAL_MOVIES,
      count: REGAL_MOVIES.length,
      message: 'Showtimes would be populated by scraping Regal website',
      lastUpdated: new Date().toISOString(),
      source: 'Regal Website (to be scraped)'
    });

  } catch (error) {
    console.error('Regal showtimes API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch showtimes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
