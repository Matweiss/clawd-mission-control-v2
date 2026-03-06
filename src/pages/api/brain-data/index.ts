import type { NextApiRequest, NextApiResponse } from 'next';
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BRAIN_DATA_PATH = '/root/.openclaw/workspace/clawd-brain-data';

interface MemoryFile {
  path: string;
  filename: string;
  title: string;
  date: string;
  type: string;
  tags: string[];
  preview: string;
  lastModified: string;
}

// Parse markdown frontmatter
function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      title: 'Untitled',
      date: new Date().toISOString(),
      type: 'memory',
      tags: []
    };
  }
  
  const frontmatter = match[1];
  const metadata: any = {};
  
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const rawValue = line.slice(colonIndex + 1).trim();
      
      let parsedValue: string | string[];
      
      // Parse arrays
      if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        parsedValue = rawValue.slice(1, -1).split(',').map((v: string) => v.trim().replace(/"/g, ''));
      } else {
        parsedValue = rawValue.replace(/"/g, '');
      }
      
      metadata[key] = parsedValue;
    }
  });
  
  return {
    title: metadata.title || 'Untitled',
    date: metadata.date || new Date().toISOString(),
    type: metadata.type || 'memory',
    tags: Array.isArray(metadata.tags) ? metadata.tags : []
  };
}

// Recursively get all markdown files
function getMarkdownFiles(dir: string, basePath: string = ''): MemoryFile[] {
  const files: MemoryFile[] = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const relativePath = join(basePath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getMarkdownFiles(fullPath, relativePath));
      } else if (item.endsWith('.md') && item !== 'README.md') {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const metadata = parseFrontmatter(content);
          const preview = content
            .replace(/^---\n[\s\S]*?\n---/, '')
            .replace(/#+ /g, '')
            .slice(0, 200) + '...';
          
          files.push({
            path: relativePath,
            filename: item,
            title: metadata.title,
            date: metadata.date,
            type: metadata.type,
            tags: metadata.tags,
            preview: preview,
            lastModified: stat.mtime.toISOString()
          });
        } catch (e) {
          console.error(`Error reading ${fullPath}:`, e);
        }
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dir}:`, e);
  }
  
  return files.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { type, limit = '50', path } = req.query;
    
    // Get specific file content
    if (path) {
      const filePath = join(BRAIN_DATA_PATH, path as string);
      const content = readFileSync(filePath, 'utf-8');
      const metadata = parseFrontmatter(content);
      
      return res.status(200).json({
        content,
        ...metadata
      });
    }
    
    // Get list of files
    let files: MemoryFile[] = [];
    
    if (type === 'memories') {
      files = getMarkdownFiles(join(BRAIN_DATA_PATH, 'memories'), 'memories');
    } else if (type === 'handoffs') {
      files = [
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'handoffs/active'), 'handoffs/active'),
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'handoffs/archived'), 'handoffs/archived')
      ];
    } else if (type === 'docs') {
      files = getMarkdownFiles(join(BRAIN_DATA_PATH, 'docs'), 'docs');
    } else if (type === 'daily') {
      files = getMarkdownFiles(join(BRAIN_DATA_PATH, 'daily'), 'daily');
    } else {
      // Get all
      files = [
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'memories'), 'memories'),
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'handoffs/active'), 'handoffs/active'),
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'handoffs/archived'), 'handoffs/archived'),
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'docs'), 'docs'),
        ...getMarkdownFiles(join(BRAIN_DATA_PATH, 'daily'), 'daily')
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    const limitNum = parseInt(limit as string, 10);
    const limitedFiles = files.slice(0, limitNum);
    
    res.status(200).json({
      files: limitedFiles,
      total: files.length,
      type: type || 'all'
    });
  } catch (error) {
    console.error('Brain data API error:', error);
    res.status(500).json({ error: 'Failed to fetch brain data' });
  }
}
