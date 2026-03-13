import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run the scraper
    const scriptPath = path.join(process.cwd(), 'scripts', 'showtimes_sherman_oaks_browserless.py');
    
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`, {
      timeout: 120000, // 2 minute timeout
      env: {
        ...process.env,
        PYTHONPATH: '/data/.openclaw/workspace/skills/theplasmak-faster-whisper/.venv/lib/python3.14/site-packages'
      }
    });

    // Parse the JSON output
    const lines = stdout.trim().split('\\n');
    const jsonLine = lines.find(line => line.startsWith('{'));
    
    if (!jsonLine) {
      throw new Error('No JSON output from scraper');
    }

    const data = JSON.parse(jsonLine);
    
    // Clean up the data
    const cleanedMovies = data.movies?.map((movie: any) => ({
      title: movie.title?.replace(/\\s+/g, ' ').trim() || 'Unknown',
      format: movie.format || 'Standard',
      showtimes: movie.showtimes?.map((t: string) => 
        t.replace(/\\s+/g, ' ').trim()
      ).filter((t: string) => t.length > 0) || []
    })).filter((m: any) => 
      m.title.length > 1 && 
      !m.title.toLowerCase().includes('premium format') &&
      !m.title.toLowerCase().includes('see all') &&
      m.showtimes.length > 0
    ) || [];

    return res.status(200).json({
      theater: 'Regal Sherman Oaks Galleria',
      officialUrl: 'https://www.regmovies.com/theatres/regal-sherman-oaks-galleria-1483',
      source: 'Fandango',
      date: new Date().toISOString().split('T')[0],
      movies: cleanedMovies,
      count: cleanedMovies.length,
      lastUpdated: new Date().toISOString(),
      rawOutput: stderr // For debugging
    });

  } catch (error) {
    console.error('API Error:', error);
    
    // Return cached data if available
    try {
      const cached = require('fs').readFileSync('/tmp/fandango_regal.json', 'utf8');
      const data = JSON.parse(cached);
      
      return res.status(200).json({
        ...data,
        cached: true,
        error: 'Using cached data - ' + (error as Error).message
      });
    } catch {
      return res.status(500).json({
        error: 'Failed to fetch showtimes',
        details: (error as Error).message
      });
    }
  }
}
