import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, Brain, Heart, Wind, AlertCircle, Coffee } from 'lucide-react';

interface AgentSoul {
  id: string;
  name: string;
  emoji: string;
  color: string;
  mood: 'sleeping' | 'thinking' | 'focused' | 'excited' | 'frustrated' | 'vibing' | 'exhausted';
  activity: number; // 0-100
  tokensUsed: number;
  lastTask: string;
  memoryAccesses: number;
  toolCalls: number;
  stressLevel: number; // 0-100
}

const AGENT_SOULS: AgentSoul[] = [
  {
    id: 'clawd-prime',
    name: 'CLAWD Prime',
    emoji: '🦞',
    color: '#F97316',
    mood: 'focused',
    activity: 85,
    tokensUsed: 45230,
    lastTask: 'Orchestrating agent swarm',
    memoryAccesses: 23,
    toolCalls: 8,
    stressLevel: 30
  },
  {
    id: 'work-agent',
    name: 'Work Agent',
    emoji: '🤖',
    color: '#3B82F6',
    mood: 'excited',
    activity: 92,
    tokensUsed: 28910,
    lastTask: 'Generating battle cards',
    memoryAccesses: 15,
    toolCalls: 12,
    stressLevel: 45
  },
  {
    id: 'build-agent',
    name: 'Build Agent',
    emoji: '🔧',
    color: '#10B981',
    mood: 'focused',
    activity: 78,
    tokensUsed: 56200,
    lastTask: 'Deploying dashboard updates',
    memoryAccesses: 8,
    toolCalls: 24,
    stressLevel: 60
  },
  {
    id: 'lifestyle-agent',
    name: 'Lifestyle Agent',
    emoji: '🧘',
    color: '#8B5CF6',
    mood: 'vibing',
    activity: 45,
    tokensUsed: 12340,
    lastTask: 'Waiting for check-in window',
    memoryAccesses: 31,
    toolCalls: 3,
    stressLevel: 10
  },
  {
    id: 'email-agent',
    name: 'Email Agent',
    emoji: '📧',
    color: '#EC4899',
    mood: 'thinking',
    activity: 95,
    tokensUsed: 8920,
    lastTask: 'Processing inbox',
    memoryAccesses: 5,
    toolCalls: 18,
    stressLevel: 25
  },
  {
    id: 'hubspot-agent',
    name: 'HubSpot Agent',
    emoji: '📊',
    color: '#06B6D4',
    mood: 'frustrated',
    activity: 65,
    tokensUsed: 15600,
    lastTask: 'Token refresh failed',
    memoryAccesses: 12,
    toolCalls: 6,
    stressLevel: 80
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    emoji: '🔍',
    color: '#22C55E',
    mood: 'thinking',
    activity: 70,
    tokensUsed: 34200,
    lastTask: 'Researching Nebula Robotics',
    memoryAccesses: 45,
    toolCalls: 9,
    stressLevel: 35
  },
];

const MOOD_CONFIG: any = {
  sleeping: { icon: Coffee, color: '#6B7280', label: 'Sleeping', pulse: false },
  thinking: { icon: Brain, color: '#3B82F6', label: 'Thinking', pulse: true },
  focused: { icon: Zap, color: '#10B981', label: 'Focused', pulse: false },
  excited: { icon: Activity, color: '#F97316', label: 'Excited', pulse: true },
  frustrated: { icon: AlertCircle, color: '#EF4444', label: 'Frustrated', pulse: true },
  vibing: { icon: Wind, color: '#8B5CF6', label: 'Vibing', pulse: false },
  exhausted: { icon: Heart, color: '#EC4899', label: 'Exhausted', pulse: true },
};

export function AgentSoulsView() {
  const [selectedAgent, setSelectedAgent] = useState<AgentSoul | null>(null);
  const [particles, setParticles] = useState<any[]>([]);

  // Generate floating particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticle = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 2,
          color: AGENT_SOULS[Math.floor(Math.random() * AGENT_SOULS.length)].color,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.5 + 0.3,
        };
        return [...prev.slice(-20), newParticle];
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Souls</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time visualization of your AI swarm's consciousness</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>{AGENT_SOULS.filter(a => a.activity > 50).length} Active</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span>{AGENT_SOULS.filter(a => a.stressLevel > 60).length} Stressed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {AGENT_SOULS.map((agent) => (
          <AgentSoulCard 
            key={agent.id}
            agent={agent}
            particles={particles}
            onClick={() => setSelectedAgent(agent)}
            isSelected={selectedAgent?.id === agent.id}
          />
        ))}
      </div>

      {selectedAgent && (
        <AgentSoulDetail 
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}

function AgentSoulCard({ agent, particles, onClick, isSelected }: {
  agent: AgentSoul;
  particles: any[];
  onClick: () => void;
  isSelected: boolean;
}) {
  const moodConfig = MOOD_CONFIG[agent.mood];
  const MoodIcon = moodConfig.icon;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 15, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw neural nodes
      const nodes = agent.memoryAccesses;
      for (let i = 0; i < nodes; i++) {
        const x = (i % 5) * 30 + 20;
        const y = Math.floor(i / 5) * 30 + 20;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = agent.color;
        ctx.fill();

        // Draw connections
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          const prevX = ((i - 1) % 5) * 30 + 20;
          const prevY = Math.floor((i - 1) / 5) * 30 + 20;
          ctx.lineTo(prevX, prevY);
          ctx.strokeStyle = `${agent.color}40`;
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [agent]);

  return (
    <div 
      onClick={onClick}
      className={`relative bg-[#161616] rounded-xl p-4 cursor-pointer transition-all overflow-hidden ${
        isSelected ? 'ring-2 ring-orange-500' : 'hover:bg-[#1A1A1A]'
      }`}
    >
      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.filter((_, i) => i % 7 === 0).map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: agent.color,
              opacity: particle.opacity,
              animation: `float ${3 / particle.speed}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative"
              style={{ 
                background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}20)`,
                boxShadow: `0 0 20px ${agent.color}30`
              }}
            >
              {agent.emoji}
              <div 
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#161616] ${
                  moodConfig.pulse ? 'animate-pulse' : ''
                }`}
                style={{ backgroundColor: moodConfig.color }}
              />
            </div>
            
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <div className="flex items-center gap-1 text-xs">
                <MoodIcon className="w-3 h-3" style={{ color: moodConfig.color }} />
                <span style={{ color: moodConfig.color }}>{moodConfig.label}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-2xl font-bold" style={{ color: agent.color }}>
              {agent.activity}%
            </span>
            <p className="text-xs text-gray-500">Activity</p>
          </div>
        </div>

        {/* Neural Canvas */}
        <div className="mb-3 relative h-24 bg-[#0F0F0F] rounded-lg overflow-hidden">
          <canvas 
            ref={canvasRef}
            width={160}
            height={96}
            className="w-full h-full"
          />
          <div className="absolute top-2 right-2 text-xs text-gray-500">
            {agent.memoryAccesses} memories
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-[#0F0F0F] rounded p-2">
            <p className="text-gray-500">Tokens</p>
            <p className="text-white font-medium">{(agent.tokensUsed / 1000).toFixed(1)}k</p>
          </div>
          
          <div className="bg-[#0F0F0F] rounded p-2">
            <p className="text-gray-500">Tools</p>
            <p className="text-white font-medium">{agent.toolCalls}</p>
          </div>
          
          <div className="bg-[#0F0F0F] rounded p-2">
            <p className="text-gray-500">Stress</p>
            <p className={`font-medium ${agent.stressLevel > 60 ? 'text-red-400' : 'text-green-400'}`}>
              {agent.stressLevel}%
            </p>
          </div>
        </div>

        {/* Current Task */}
        <div className="mt-3 p-2 bg-[#0F0F0F] rounded text-xs">
          <p className="text-gray-500 mb-0.5">Current Task</p>
          <p className="text-gray-300 truncate">{agent.lastTask}</p>
        </div>
      </div>
    </div>
  );
}

function AgentSoulDetail({ agent, onClose }: { agent: AgentSoul; onClose: () => void }) {
  const moodConfig = MOOD_CONFIG[agent.mood];
  const MoodIcon = moodConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#161616] rounded-2xl max-w-2xl w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#2A2A2A] rounded-lg"
        >
          ✕
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ 
              background: `linear-gradient(135deg, ${agent.color}40, ${agent.color}20)`,
              boxShadow: `0 0 40px ${agent.color}40`
            }}
          >
            {agent.emoji}
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <MoodIcon className="w-5 h-5" style={{ color: moodConfig.color }} />
              <span className="text-lg" style={{ color: moodConfig.color }}>{moodConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0F0F0F] rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-3">Activity Metrics</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Activity Level</span>
                  <span className="text-white">{agent.activity}%</span>
                </div>
                <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${agent.activity}%`, backgroundColor: agent.color }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Stress Level</span>
                  <span className={agent.stressLevel > 60 ? 'text-red-400' : 'text-green-400'}>
                    {agent.stressLevel}%
                  </span>
                </div>
                <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${agent.stressLevel}%`, 
                      backgroundColor: agent.stressLevel > 60 ? '#EF4444' : '#10B981'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F0F0F] rounded-xl p-4">
            <h3 className="text-sm text-gray-400 mb-3">Neural Activity</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-[#161616] rounded-lg">
                <p className="text-2xl font-bold text-white">{agent.memoryAccesses}</p>
                <p className="text-xs text-gray-500">Memory Accesses</p>
              </div>
              
              <div className="text-center p-3 bg-[#161616] rounded-lg">
                <p className="text-2xl font-bold text-white">{agent.toolCalls}</p>
                <p className="text-xs text-gray-500">Tool Calls</p>
              </div>
              
              <div className="text-center p-3 bg-[#161616] rounded-lg">
                <p className="text-2xl font-bold text-white">{(agent.tokensUsed / 1000).toFixed(1)}k</p>
                <p className="text-xs text-gray-500">Tokens Used</p>
              </div>
              
              <div className="text-center p-3 bg-[#161616] rounded-lg">
                <p className="text-2xl font-bold text-blue-400">Active</p>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-[#0F0F0F] rounded-xl">
          <h3 className="text-sm text-gray-400 mb-2">Current Task</h3>
          <p className="text-white">{agent.lastTask}</p>
        </div>
      </div>
    </div>
  );
}
