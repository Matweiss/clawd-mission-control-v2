import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface YogaClass {
  date: string;
  classType: string;
  teacher: string;
  time: string;
  location: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the yoga history log
    const logPath = path.join(process.cwd(), 'memory', 'logs', '2026-03-16-corepower-yoga-history.md');
    const projectPath = path.join(process.cwd(), 'memory', 'projects', 'yoga-fitness-tracking.md');

    let classes: YogaClass[] = [];
    let totalClasses = 51;
    let buddyPasses = 2;
    let buddyPassExpiry = '2026-04-01';

    // Parse the log file if it exists
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      
      // Extract recent classes from the table
      const tableMatch = content.match(/\| Date \| Class \| Teacher \| Time \| Location \|[\s\S]+?(?=\n\n|\n##)/);
      if (tableMatch) {
        const lines = tableMatch[0].split('\n').slice(2); // Skip header and separator
        classes = lines
          .filter(line => line.startsWith('|'))
          .map(line => {
            const parts = line.split('|').filter(p => p.trim());
            if (parts.length >= 4) {
              return {
                date: parts[0].trim(),
                classType: parts[1].trim(),
                teacher: parts[2].trim(),
                time: parts[3].trim(),
                location: parts[4]?.trim() || 'Encino',
              };
            }
            return null;
          })
          .filter((c): c is YogaClass => c !== null);
      }
    }

    // Read project file for additional data
    if (fs.existsSync(projectPath)) {
      const projectContent = fs.readFileSync(projectPath, 'utf8');
      
      // Extract total classes
      const totalMatch = projectContent.match(/\*\*Total Classes:\*\* (\d+)/);
      if (totalMatch) totalClasses = parseInt(totalMatch[1]);
      
      // Extract buddy passes
      const buddyMatch = projectContent.match(/\*\*Buddy Passes:\*\* (\d+)/);
      if (buddyMatch) buddyPasses = parseInt(buddyMatch[1]);
    }

    return res.status(200).json({
      totalClasses,
      studioClasses: totalClasses - 1,
      liveClasses: 1,
      recentClasses: classes.slice(0, 5),
      buddyPasses,
      buddyPassExpiry,
      completedChallenge: 'Live Your Power Challenge (Jan 2026)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Yoga data API error:', error);
    return res.status(500).json({ error: 'Failed to fetch yoga data' });
  }
}
