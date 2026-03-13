import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for now - can be moved to Google Sheet later
let watchlist: MovieEntry[] = [];
let seenList: MovieEntry[] = [];

interface MovieEntry {
  id: number;
  title: string;
  poster_path: string | null;
  addedAt: string;
  rating?: number; // 1-5 stars for seen movies
  notes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      watchlist,
      seenList,
      watchlistCount: watchlist.length,
      seenCount: seenList.length
    });
  }

  if (req.method === 'POST') {
    const { action, movie } = req.body;

    if (!action || !movie) {
      return res.status(400).json({ error: 'Missing action or movie' });
    }

    if (action === 'addToWatchlist') {
      // Check if already in watchlist
      if (watchlist.find(m => m.id === movie.id)) {
        return res.status(200).json({ message: 'Already in watchlist', watchlist });
      }

      watchlist.push({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        addedAt: new Date().toISOString()
      });

      return res.status(200).json({ 
        message: 'Added to watchlist',
        watchlist,
        seenList
      });
    }

    if (action === 'markAsSeen') {
      // Remove from watchlist if present
      watchlist = watchlist.filter(m => m.id !== movie.id);

      // Check if already in seen list
      const existingIndex = seenList.findIndex(m => m.id === movie.id);
      
      if (existingIndex >= 0) {
        // Update existing entry
        seenList[existingIndex] = {
          ...seenList[existingIndex],
          rating: movie.rating,
          notes: movie.notes,
          addedAt: new Date().toISOString()
        };
      } else {
        // Add new entry
        seenList.push({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          addedAt: new Date().toISOString(),
          rating: movie.rating,
          notes: movie.notes
        });
      }

      return res.status(200).json({
        message: 'Marked as seen',
        watchlist,
        seenList
      });
    }

    if (action === 'removeFromWatchlist') {
      watchlist = watchlist.filter(m => m.id !== movie.id);
      return res.status(200).json({
        message: 'Removed from watchlist',
        watchlist,
        seenList
      });
    }

    if (action === 'removeFromSeen') {
      seenList = seenList.filter(m => m.id !== movie.id);
      return res.status(200).json({
        message: 'Removed from seen list',
        watchlist,
        seenList
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
