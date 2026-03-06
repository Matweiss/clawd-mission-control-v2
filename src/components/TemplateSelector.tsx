import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  CheckSquare, 
  Lightbulb, 
  BookOpen,
  X,
  ChevronRight
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  type: 'memory' | 'handoff' | 'decision' | 'doc';
  content: string;
  tags: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'daily-standup',
    name: 'Daily Standup',
    icon: <Calendar className="w-5 h-5" />,
    description: 'What I did yesterday, what I\'m doing today, blockers',
    type: 'memory',
    tags: ['standup', 'daily', 'work'],
    content: `## Yesterday
- 

## Today
- 

## Blockers
- None

## Notes
`
  },
  {
    id: 'weekly-retro',
    name: 'Weekly Retro',
    icon: <CheckSquare className="w-5 h-5" />,
    description: 'Wins, challenges, learnings, next week focus',
    type: 'memory',
    tags: ['retro', 'weekly', 'reflection'],
    content: `## 🏆 Wins This Week
- 

## 😤 Challenges
- 

## 💡 Learnings
- 

## 🎯 Next Week Focus
- 

## 📝 Notes
`
  },
  {
    id: 'project-kickoff',
    name: 'Project Kickoff',
    icon: <Lightbulb className="w-5 h-5" />,
    description: 'Goals, scope, timeline, stakeholders',
    type: 'decision',
    tags: ['project', 'kickoff', 'planning'],
    content: `## Project Overview

### Goals
- 

### Scope
- In scope:
- Out of scope:

### Timeline
- Start: 
- End: 
- Milestones:

### Stakeholders
- 

### Resources Needed
- 

### Risks
- 
`
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    icon: <FileText className="w-5 h-5" />,
    description: 'Issue description, reproduction steps, expected vs actual',
    type: 'memory',
    tags: ['bug', 'technical'],
    content: `## Issue Description

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior

### Actual Behavior

### Environment
- OS: 
- Browser: 
- Version: 

### Screenshots/Logs

### Possible Solution
`
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Attendees, agenda, decisions, action items',
    type: 'memory',
    tags: ['meeting', 'notes'],
    content: `## Meeting Info
- **Date:** 
- **Attendees:** 
- **Purpose:** 

## Agenda
1. 
2. 
3. 

## Discussion Points

## Decisions Made
- 

## Action Items
- [ ] 
- [ ] 

## Next Steps
`
  },
  {
    id: 'decision-record',
    name: 'Decision Record (ADR)',
    icon: <Lightbulb className="w-5 h-5" />,
    description: 'Architecture Decision Record template',
    type: 'decision',
    tags: ['adr', 'decision', 'architecture'],
    content: `## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing or have agreed to implement?

## Consequences
What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.

### Positive
- 

### Negative
- 

### Risks
- 

## Alternatives Considered
- 

## Decision Date

## Participants
`
  }
];

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredTemplates = selectedType
    ? TEMPLATES.filter(t => t.type === selectedType)
    : TEMPLATES;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'memory': return 'text-purple-400 border-purple-500/30';
      case 'handoff': return 'text-orange-400 border-orange-500/30';
      case 'decision': return 'text-yellow-400 border-yellow-500/30';
      case 'doc': return 'text-blue-400 border-blue-500/30';
      default: return 'text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-xl border border-purple-500/30 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Memory Templates</h2>
            <p className="text-xs text-gray-500">Choose a template to get started quickly</p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 p-4 border-b border-gray-800">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedType === null
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
            }`}
          >
            All
          </button>
          {['memory', 'handoff', 'decision', 'doc'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                selectedType === type
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className={`p-4 bg-[#1a1a1a] rounded-xl border text-left hover:bg-[#222] transition-all group ${getTypeColor(template.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-opacity-20 flex items-center justify-center ${
                    template.type === 'memory' ? 'bg-purple-500' :
                    template.type === 'handoff' ? 'bg-orange-500' :
                    template.type === 'decision' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}>
                    {template.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-[#222] rounded text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { TEMPLATES };
export type { Template };
