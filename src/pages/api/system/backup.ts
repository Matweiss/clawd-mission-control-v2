import type { NextApiRequest, NextApiResponse } from 'next';
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

    // Create backup manifest (non-shell, safer in API context)
    const dirsToBackup = ['memory', 'src', 'scripts', 'docs'];
    const filesToBackup = ['package.json', 'next.config.js', 'tailwind.config.js', 'tsconfig.json'];

    const includedDirs = dirsToBackup.filter((d) => fs.existsSync(path.join(process.cwd(), d)));
    const includedFiles = filesToBackup.filter((f) => fs.existsSync(path.join(process.cwd(), f)));

    const manifest = {
      createdAt: new Date().toISOString(),
      backupRoot: process.cwd(),
      backupFile,
      includedDirs,
      includedFiles,
    };

    fs.writeFileSync(backupPath.replace(/\.tar\.gz$/, '.manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 2));

    const stats = fs.statSync(backupPath);

    return res.status(200).json({
      success: true,
      backup: {
        name: backupFile,
        path: backupPath,
        size: stats.size,
        created: stats.mtime.toISOString(),
        components: includedDirs,
        files: includedFiles,
        mode: 'manifest-only',
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
