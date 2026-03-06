import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const BRAIN_DATA_PATH = '/root/.openclaw/workspace/clawd-brain-data';

interface MemoryData {
  title: string;
  content: string;
  type: 'memory' | 'handoff' | 'decision' | 'doc';
  tags: string[];
  related?: string[];
  author?: string;
  mood?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

function generateFrontmatter(data: MemoryData): string {
  const date = new Date().toISOString();
  const tagsStr = data.tags.map(t => `"${t}"`).join(', ');
  const relatedStr = data.related ? data.related.map(r => `"${r}"`).join(', ') : '';
  
  let frontmatter = `---
title: "${data.title}"
date: ${date}
type: ${data.type}
tags: [${tagsStr}]`;

  if (data.author) frontmatter += `\nauthor: ${data.author}`;
  if (data.mood) frontmatter += `\nmood: ${data.mood}`;
  if (relatedStr) frontmatter += `\nrelated: [${relatedStr}]`;
  
  frontmatter += '\n---\n\n';
  return frontmatter;
}

function getFilePath(type: string, title: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slug = generateSlug(title);
  
  switch (type) {
    case 'memory':
      return `memories/${year}/${month}/${year}-${month}-${day}-${slug}.md`;
    case 'handoff':
      return `handoffs/active/${year}-${month}-${day}-${slug}.md`;
    case 'decision':
      return `docs/decisions/${year}-${month}-${day}-${slug}.md`;
    case 'doc':
      return `docs/processes/${year}-${month}-${day}-${slug}.md`;
    default:
      return `memories/${year}/${month}/${year}-${month}-${day}-${slug}.md`;
  }
}

function commitToGit(filePath: string, title: string) {
  try {
    execSync('git add -A', { cwd: BRAIN_DATA_PATH });
    execSync(`git commit -m "[memory] ${title}"`, { cwd: BRAIN_DATA_PATH });
    execSync('git push origin main', { cwd: BRAIN_DATA_PATH });
    return true;
  } catch (error) {
    console.error('Git commit failed:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: MemoryData = req.body;
    
    // Validate
    if (!data.title || !data.content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Generate file path
    const relativePath = getFilePath(data.type, data.title);
    const fullPath = join(BRAIN_DATA_PATH, relativePath);
    
    // Ensure directory exists
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Generate content
    const frontmatter = generateFrontmatter(data);
    const fullContent = frontmatter + data.content;
    
    // Write file
    writeFileSync(fullPath, fullContent, 'utf-8');
    
    // Commit to git (async, don't wait)
    commitToGit(relativePath, data.title);
    
    res.status(200).json({
      success: true,
      path: relativePath,
      message: 'Memory created successfully'
    });
  } catch (error) {
    console.error('Create memory error:', error);
    res.status(500).json({ error: 'Failed to create memory' });
  }
}
