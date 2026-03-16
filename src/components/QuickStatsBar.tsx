import React from 'react';
import { Mail, TrendingUp, Dumbbell, Film, Bell, Award, Reply } from 'lucide-react';

interface QuickStatsProps {
  urgentEmails: number;
  replyNeededEmails: number;
  pipelineMRR: string;
  pipelineARR: string;
  yogaClasses: number;
  watchlistCount: number;
  buddyPasses: number;
  buddyPassDays: number;
  onUrgentClick?: () => void;
  onReplyNeededClick?: () => void;
  onPipelineClick?: () => void;
}

export function QuickStatsBar({ 
  urgentEmails = 0, 
  replyNeededEmails = 0,
  pipelineMRR = '$4.3k', 
  pipelineARR = '$51.3k',
  yogaClasses = 51, 
  watchlistCount = 0,
  buddyPasses = 2,
  buddyPassDays = 16,
  onUrgentClick,
  onReplyNeededClick,
  onPipelineClick,
}: QuickStatsProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {/* Urgent Emails */}
      <button
        onClick={onUrgentClick}
        className={`flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity ${
          urgentEmails > 0 ? 'text-red-400' : 'text-gray-500'
        } ${urgentEmails > 0 ? 'animate-pulse' : ''}`}
      >
        <Mail className="w-3.5 h-3.5" />
        <span className="font-medium">{urgentEmails > 0 ? `${urgentEmails} urgent` : '0 urgent'}</span>
      </button>
      
      <div className="w-px h-4 bg-border" />
      
      {/* Reply Needed */}
      <button
        onClick={onReplyNeededClick}
        className={`flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity ${
          replyNeededEmails > 0 ? 'text-yellow-400' : 'text-gray-500'
        }`}
      >
        <Reply className="w-3.5 h-3.5" />
        <span className="font-medium">{replyNeededEmails > 0 ? `${replyNeededEmails} reply` : '0 reply'}</span>
      </button>
      
      <div className="w-px h-4 bg-border" />
      
      {/* Pipeline */}
      <button
        onClick={onPipelineClick}
        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:opacity-80 transition-opacity"
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="font-medium">{pipelineMRR} MRR</span>
      </button>
      
      <div className="w-px h-4 bg-border" />
      
      <div className="flex items-center gap-1.5 text-xs text-orange-400">
        <Dumbbell className="w-3.5 h-3.5" />
        <span className="font-medium">{yogaClasses} classes</span>
      </div>
      
      <div className="w-px h-4 bg-border" />
      
      <div className="flex items-center gap-1.5 text-xs text-pink-400">
        <Film className="w-3.5 h-3.5" />
        <span className="font-medium">{watchlistCount} watchlist</span>
      </div>
      
      <div className="w-px h-4 bg-border" />
      
      <div className={`flex items-center gap-1.5 text-xs ${
        buddyPassDays <= 7 ? 'text-red-400' : buddyPassDays <= 14 ? 'text-yellow-400' : 'text-gray-400'
      } ${buddyPassDays <= 14 ? 'animate-pulse' : ''}`}>
        <Award className="w-3.5 h-3.5" />
        <span className="font-medium">{buddyPasses} buddy</span>
      </div>
    </div>
  );
}
