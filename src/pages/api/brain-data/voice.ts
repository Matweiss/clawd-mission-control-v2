import type { NextApiRequest, NextApiResponse } from 'next';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const REPO_OWNER = 'Matweiss';
const REPO_NAME = 'clawd-brain-data';

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

async function transcribeWithGroq(audioBase64: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes('webm') ? 'webm' : 
              mimeType.includes('mp4') ? 'm4a' : 
              mimeType.includes('mp3') ? 'mp3' : 'wav';
  
  // Convert base64 to buffer and then to blob
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  
  const formData = new FormData();
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

async function createFileInGitHub(path: string, content: string, message: string): Promise<boolean> {
  try {
    const contentBase64 = Buffer.from(content).toString('base64');
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          content: contentBase64,
          branch: 'main'
        })
      }
    );
    
    return response.ok;
  } catch (error) {
    console.error('Error creating file:', error);
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
    const { audioBase64, mimeType, title, tags = [], type = 'memory' }: TranscribeRequest = req.body;
    
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Transcribe
    let transcription: string;
    try {
      transcription = await transcribeWithGroq(audioBase64, mimeType);
    } catch (error) {
      console.error('Transcription error:', error);
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
    
    const memoryTitle = title || `Voice Note - ${new Date().toLocaleDateString()}`;
    const relativePath = getFilePath(type, memoryTitle);
    
    const frontmatter = generateFrontmatter(memoryTitle, type, tags);
    const fullContent = frontmatter + transcription;
    
    const success = await createFileInGitHub(
      relativePath,
      fullContent,
      `[voice] ${memoryTitle}`
    );
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to save voice note' });
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
