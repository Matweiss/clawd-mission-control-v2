import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Link2, Sparkles } from 'lucide-react';

interface RelatedMemory {
  path: string;
  title: string;
  type: string;
  similarity: number;
  preview: string;
}

interface MemorySuggestionsProps {
  currentTitle: string;
  currentContent: string;
  currentTags: string[];
  onSelectMemory: (path: string) => void;
}

export function MemorySuggestions({ 
  currentTitle, 
  currentContent, 
  currentTags,
  onSelectMemory 
}: MemorySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RelatedMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!currentTitle && !currentContent) {
      setSuggestions([]);
      return;
    }

    // Debounce the search
    const timer = setTimeout(() => {
      findRelatedMemories();
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentTitle, currentContent, currentTags]);

  const findRelatedMemories = async () => {
    if (currentTitle.length < 3 && currentContent.length < 10) return;

    setLoading(true);
    try {
      // Fetch all memories
      const response = await fetch('/api/brain-data?limit=50');
      if (!response.ok) return;

      const data = await response.json();
      
      // Calculate simple similarity based on shared words/tags
      const currentText = (currentTitle + ' ' + currentContent).toLowerCase();
      const currentWords = new Set(currentText.split(/\s+/).filter(w => w.length > 3));
      const currentWordsArray = Array.from(currentWords);
      
      const scored = data.files.map((file: any) => {
        const fileText = (file.title + ' ' + file.preview).toLowerCase();
        const fileWords = new Set(fileText.split(/\s+/).filter(w => w.length > 3));
        
        // Word overlap
        const sharedWords = currentWordsArray.filter(w => fileWords.has(w));
        let score = sharedWords.length;
        
        // Tag overlap
        const sharedTags = currentTags.filter(tag => 
          file.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
        );
        score += sharedTags.length * 2; // Tags weighted more
        
        // Title similarity bonus
        if (file.title.toLowerCase().includes(currentTitle.toLowerCase()) ||
            currentTitle.toLowerCase().includes(file.title.toLowerCase())) {
          score += 3;
        }
        
        return {
          path: file.path,
          title: file.title,
          type: file.type,
          similarity: score,
          preview: file.preview
        };
      });

      // Filter and sort
      const relevant = scored
        .filter((m: RelatedMemory) => m.similarity > 0)
        .sort((a: RelatedMemory, b: RelatedMemory) => b.similarity - a.similarity)
        .slice(0, 3);

      setSuggestions(relevant);
    } catch (error) {
      console.error('Failed to find related memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'memory': return 'text-purple-400';
      case 'handoff': return 'text-orange-400';
      case 'decision': return 'text-yellow-400';
      case 'doc': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (dismissed || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Related Memories</span>
          {loading && <span className="text-xs text-gray-500">Searching...</span>}
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-gray-800 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((memory) => (
          <button
            key={memory.path}
            onClick={() => onSelectMemory(memory.path)}
            className="w-full text-left p-3 bg-[#222] rounded-lg hover:bg-[#2a2a2a] transition-colors group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${getTypeColor(memory.type)}`}>
                {memory.type}
              </span>
              <span className="text-xs text-gray-500">
                {memory.similarity} match
              </span>
              <Link2 className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 ml-auto" />
            </div>
            
            <h4 className="text-sm text-white font-medium truncate">{memory.title}</h4>
            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{memory.preview}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
