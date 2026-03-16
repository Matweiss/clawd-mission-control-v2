import type { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backups directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = `clawd-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(backupDir, backupFile);

    // Create backup archive
    const dirsToBackup = ['memory', 'src', 'scripts', 'docs'];
    const filesToBackup = ['package.json', 'next.config.js', 'tailwind.config.js', 'tsconfig.json'];
    
    // Build tar command
    const tarArgs = [
      '-czf',
      backupPath,
      ...dirsToBackup.filter((d) => fs.existsSync(path.join(process.cwd(), d))),
      ...filesToBackup.filter((f) => fs.existsSync(path.join(process.cwd(), f))),
    ];

    execSync(`tar ${tarArgs.join(' ')}`, {
      cwd: process.cwd(),
      timeout: 30000,
    });

    const stats = fs.statSync(backupPath);

    return res.status(200).json({
      success: true,
      backup: {
        name: backupFile,
        path: backupPath,
        size: stats.size,
        created: stats.mtime.toISOString(),
        components: dirsToBackup.filter((d) => fs.existsSync(path.join(process.cwd(), d))),
      },
    });
  } catch (error) {
    console.error('Backup generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate backup',
      details: (error as Error).message,
    });
  }
}
