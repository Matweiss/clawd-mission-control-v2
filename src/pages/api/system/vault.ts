import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface MemoryFile {
  slug: string;
  name: string;
  title: string;
  type: string;
  created: string;
  updated: string;
  tags: string[];
  status: string;
  excerpt: string;
  content: string;
}

function parseFrontmatter(content: string): { frontmatter: any; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: any = {};
  match[1].split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key.trim()] = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim());
      } else {
        frontmatter[key.trim()] = value;
      }
    }
  });

  return { frontmatter, body: match[2] };
}

function getFiles(dir: string): MemoryFile[] {
  const memoryDir = path.join(process.cwd(), 'memory', dir);
  if (!fs.existsSync(memoryDir)) return [];

  const files = fs.readdirSync(memoryDir).filter((f) => f.endsWith('.md'));
  const memoryFiles: MemoryFile[] = [];

  for (const file of files) {
    const filePath = path.join(memoryDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    const titleMatch = body.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

    const excerpt = body
      .replace(/^# .+$/m, '')
      .replace(/[#*\[\]()`]/g, '')
      .trim()
      .slice(0, 150);

    memoryFiles.push({
      slug: file.replace('.md', ''),
      name: file,
      title,
      type: frontmatter.type || dir,
      created: frontmatter.created || 'unknown',
      updated: frontmatter.updated || frontmatter.created || 'unknown',
      tags: frontmatter.tags || [],
      status: frontmatter.status || 'unknown',
      excerpt: excerpt + (excerpt.length >= 150 ? '...' : ''),
      content: body,
    });
  }

  return memoryFiles.sort((a, b) => {
    if (a.created === 'unknown') return 1;
    if (b.created === 'unknown') return -1;
    return b.created.localeCompare(a.created);
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const context = getFiles('context');
    const projects = getFiles('projects');
    const decisions = getFiles('decisions');
    const logs = getFiles('logs');

    // Get bootstrap and SOP
    const bootstrapPath = path.join(process.cwd(), 'memory', 'BOOTSTRAP.md');
    const sopPath = path.join(process.cwd(), 'memory', 'MEMORY-SOP.md');

    const bootstrap = fs.existsSync(bootstrapPath)
      ? fs.readFileSync(bootstrapPath, 'utf8')
      : '';
    const sop = fs.existsSync(sopPath) ? fs.readFileSync(sopPath, 'utf8') : '';

    // Get backup info
    const backupsDir = path.join(process.cwd(), 'backups');
    const backups = fs.existsSync(backupsDir)
      ? fs.readdirSync(backupsDir).filter((f) => f.endsWith('.tar.gz')).map((f) => ({
          name: f,
          size: fs.statSync(path.join(backupsDir, f)).size,
          created: fs.statSync(path.join(backupsDir, f)).mtime.toISOString(),
        }))
      : [];

    return res.status(200).json({
      context,
      projects,
      decisions,
      logs,
      system: { bootstrap, sop },
      backups,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Vault API error:', error);
    return res.status(500).json({ error: 'Failed to read memory files' });
  }
}
