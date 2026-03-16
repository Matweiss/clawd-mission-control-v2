import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface MemoryFile {
  slug: string;
  title: string;
  type: string;
  created: string;
  updated: string;
  tags: string[];
  status: string;
  content: string;
  excerpt: string;
}

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: {},
      body: content,
    };
  }

  const frontmatter: Record<string, any> = {};
  match[1].split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      // Parse arrays
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

function getMemoryFiles(dir: string): MemoryFile[] {
  const memoryDir = path.join(process.cwd(), 'memory', dir);
  if (!fs.existsSync(memoryDir)) return [];

  const files = fs.readdirSync(memoryDir);
  const memoryFiles: MemoryFile[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(memoryDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);

    // Extract title from first h1
    const titleMatch = body.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

    // Create excerpt (first 200 chars of body, stripped of markdown)
    const excerpt = body
      .replace(/^# .+$/m, '')
      .replace(/[#*\[\]()`]/g, '')
      .trim()
      .slice(0, 200);

    memoryFiles.push({
      slug: file.replace('.md', ''),
      title,
      type: frontmatter.type || dir,
      created: frontmatter.created || 'unknown',
      updated: frontmatter.updated || frontmatter.created || 'unknown',
      tags: frontmatter.tags || [],
      status: frontmatter.status || 'unknown',
      content: body,
      excerpt: excerpt + (excerpt.length >= 200 ? '...' : ''),
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
    const context = getMemoryFiles('context');
    const projects = getMemoryFiles('projects');
    const decisions = getMemoryFiles('decisions');
    const logs = getMemoryFiles('logs');

    // Get bootstrap and SOP content
    const bootstrapPath = path.join(process.cwd(), 'memory', 'BOOTSTRAP.md');
    const sopPath = path.join(process.cwd(), 'memory', 'MEMORY-SOP.md');

    const bootstrap = fs.existsSync(bootstrapPath)
      ? fs.readFileSync(bootstrapPath, 'utf8')
      : '';
    const sop = fs.existsSync(sopPath)
      ? fs.readFileSync(sopPath, 'utf8')
      : '';

    res.status(200).json({
      context,
      projects,
      decisions,
      logs,
      system: {
        bootstrap,
        sop,
      },
    });
  } catch (error) {
    console.error('Error reading memory files:', error);
    res.status(500).json({ error: 'Failed to read memory files' });
  }
}
