import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Save, 
  X, 
  Tag, 
  Link, 
  FileText, 
  GitCommit,
  Sparkles,
  MicOff,
  Loader2
} from 'lucide-react';

interface MemoryEditorProps {
  onClose: () => void;
  onSave: () => void;
}

const MEMORY_TYPES = [
  { id: 'memory', label: 'Memory', icon: '📝' },
  { id: 'handoff', label: 'Handoff', icon: '🔄' },
  { id: 'decision', label: 'Decision', icon: '⚡' },
  { id: 'doc', label: 'Document', icon: '📄' }
];

const HANDOFF_AGENTS = [
  'CLAWD Prime',
  'Work Agent', 
  'Build Agent',
  'Research Agent',
  'Lifestyle Agent',
  'Email Agent',
  'HubSpot Agent'
];

const HANDOFF_STATUSES = [
  { id: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { id: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { id: 'active', label: 'Active', color: 'bg-blue-500' },
  { id: 'complete', label: 'Complete', color: 'bg-green-500' },
  { id: 'archived', label: 'Archived', color: 'bg-purple-500' }
];

export function MemoryEditor({ onClose, onSave }: MemoryEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'memory' | 'handoff' | 'decision' | 'doc'>('memory');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Handoff-specific fields
  const [handoffFrom, setHandoffFrom] = useState('');
  const [handoffTo, setHandoffTo] = useState('');
  const [handoffStatus, setHandoffStatus] = useState<'draft' | 'pending' | 'active' | 'complete' | 'archived'>('draft');
  const [handoffPriority, setHandoffPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [handoffDue, setHandoffDue] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) return;

        const response = await fetch('/api/brain-data/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type,
            title: title || undefined,
            tags,
            type
          })
        });

        if (response.ok) {
          const data = await response.json();
          setContent(prev => prev + '\n\n' + data.transcription);
          if (!title) setTitle(data.title);
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSaving(true);
    
    try {
      const endpoint = type === 'handoff' ? '/api/brain-data/handoff' : '/api/brain-data/create';
      
      const payload: any = {
        title,
        content,
        type,
        tags,
        author: 'Mat'
      };

      if (type === 'handoff') {
        payload.from = handoffFrom;
        payload.to = handoffTo;
        payload.status = handoffStatus;
        payload.priority = handoffPriority;
        payload.due = handoffDue || undefined;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save memory');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMarkdownPreview = (text: string) => {
    // Simple markdown rendering
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="text-gray-300">$1</em>')
      .replace(/- \[ \] (.*$)/gim, '<div class="flex items-center gap-2"><span class="w-4 h-4 border border-gray-600 rounded"></span><span>$1</span></div>')
      .replace(/- \[x\] (.*$)/gim, '<div class="flex items-center gap-2"><span class="w-4 h-4 bg-green-500 rounded flex items-center justify-center text-xs">✓</span><span class="line-through text-gray-500">$1</span></div>')
      .replace(/- (.*$)/gim, '<li class="ml-4 text-gray-300">$1</li>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl border border-purple-500/30 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Memory</h2>
              <p className="text-xs text-gray-500">Log a new memory, handoff, or decision</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2">
            {MEMORY_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  type === t.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            type="text"
            placeholder="Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1a1a1a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          {/* Handoff-specific fields */}
          {type === 'handoff' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#1a1a1a] rounded-lg">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <select
                  value={handoffFrom}
                  onChange={(e) => setHandoffFrom(e.target.value)}
                  className="w-full bg-[#222] rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">Select agent...</option>
                  {HANDOFF_AGENTS.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <select
                  value={handoffTo}
                  onChange={(e) => setHandoffTo(e.target.value)}
                  className="w-full bg-[#222] rounded px-3 py-2 text-sm text-white"
                >
                  <option value="">Select agent...</option>
                  {HANDOFF_AGENTS.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select
                  value={handoffStatus}
                  onChange={(e) => setHandoffStatus(e.target.value as any)}
                  className="w-full bg-[#222] rounded px-3 py-2 text-sm text-white"
                >
                  {HANDOFF_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                <select
                  value={handoffPriority}
                  onChange={(e) => setHandoffPriority(e.target.value as any)}
                  className="w-full bg-[#222] rounded px-3 py-2 text-sm text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={handoffDue}
                  onChange={(e) => setHandoffDue(e.target.value)}
                  className="w-full bg-[#222] rounded px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#1a1a1a] rounded-lg">
            <Tag className="w-4 h-4 text-gray-500" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-purple-300"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          {/* Content Editor */}
          <div className="flex gap-2 border-b border-gray-800 pb-2">
            <button
              onClick={() => setShowPreview(false)}
              className={`text-xs px-3 py-1 rounded ${!showPreview ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`text-xs px-3 py-1 rounded ${showPreview ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500'}`}
            >
              Preview
            </button>
          </div>

          {showPreview ? (
            <div 
              className="min-h-[200px] p-4 bg-[#1a1a1a] rounded-lg text-gray-300 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(content) }}
            />
          ) : (
            <textarea
              placeholder="Write your memory here... Use markdown for formatting.

# Heading
**bold** *italic*
- [ ] Task
- Bullet point"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[200px] bg-[#1a1a1a] rounded-lg p-4 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y font-mono text-sm"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-[#0f0f0f]">
          <div className="flex items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Voice to Memory
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <GitCommit className="w-4 h-4" />
                  Save to Brain Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
