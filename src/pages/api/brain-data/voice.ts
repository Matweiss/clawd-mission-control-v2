import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const BRAIN_DATA_PATH = '/root/.openclaw/workspace/clawd-brain-data';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

interface TranscribeRequest {
  audioBase64: string;
  mimeType: string;
  title?: string;
  tags?: string[];
  type?: 'memory' | 'handoff' | 'decision';
}

async function transcribeWithGroq(audioBuffer: Buffer, mimeType: string): Promise<string> {
  // Determine file extension
  const ext = mimeType.includes('webm') ? 'webm' : 
              mimeType.includes('mp4') ? 'm4a' : 
              mimeType.includes('mp3') ? 'mp3' : 'wav';
  
  // Create form data
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'text');
  
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status}`);
  }
  
  return await response.text();
}

function generateFrontmatter(title: string, type: string, tags: string[]): string {
  const date = new Date().toISOString();
  const tagsStr = tags.map(t => `"${t}"`).join(', ');
  
  return `---
title: "${title}"
date: ${date}
type: ${type}
tags: [${tagsStr}, "voice-note"]
source: voice
---

`;
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
}

function getFilePath(type: string, title: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slug = generateSlug(title);
  
  return `memories/${year}/${month}/${year}-${month}-${day}-voice-${slug}.md`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioBase64, mimeType, title, tags = [], type = 'memory' }: TranscribeRequest = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Transcribe
    let transcription: string;
    try {
      transcription = await transcribeWithGroq(audioBuffer, mimeType);
    } catch (error) {
      console.error('Transcription error:', error);
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
    
    // Generate title if not provided
    const memoryTitle = title || `Voice Note - ${new Date().toLocaleDateString()}`;
    
    // Generate file path
    const relativePath = getFilePath(type, memoryTitle);
    const fullPath = join(BRAIN_DATA_PATH, relativePath);
    
    // Ensure directory exists
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Generate content
    const frontmatter = generateFrontmatter(memoryTitle, type, tags);
    const fullContent = frontmatter + transcription;
    
    // Write file
    writeFileSync(fullPath, fullContent, 'utf-8');
    
    // Git commit
    try {
      execSync('git add -A', { cwd: BRAIN_DATA_PATH });
      execSync(`git commit -m "[voice] ${memoryTitle}"`, { cwd: BRAIN_DATA_PATH });
      execSync('git push origin main', { cwd: BRAIN_DATA_PATH });
    } catch (e) {
      console.log('Git commit optional');
    }
    
    res.status(200).json({
      success: true,
      transcription,
      path: relativePath,
      title: memoryTitle
    });
  } catch (error) {
    console.error('Voice to memory error:', error);
    res.status(500).json({ error: 'Failed to process voice note' });
  }
}
