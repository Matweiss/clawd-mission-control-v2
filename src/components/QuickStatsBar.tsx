import React from 'react';
import { Mail, TrendingUp, Dumbbell, Film, Bell, Award } from 'lucide-react';

interface QuickStatsProps {
  urgentEmails: number;
  pipelineValue: string;
  yogaClasses: number;
  watchlistCount: number;
  buddyPasses: number;
  buddyPassDays: number;
}

export function QuickStatsBar({ 
  urgentEmails = 0, 
  pipelineValue = '$18.4k', 
  yogaClasses = 51, 
  watchlistCount = 0,
  buddyPasses = 2,
  buddyPassDays = 16
}: QuickStatsProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <StatItem 
        icon={<Mail className="w-3.5 h-3.5" />} 
        value={urgentEmails > 0 ? `${urgentEmails} urgent` : '0 urgent'} 
        color={urgentEmails > 0 ? 'text-red-400' : 'text-gray-500'}
        alert={urgentEmails > 0}
      />
      
      <div className="w-px h-4 bg-border" />
      
      <StatItem 
        icon={<TrendingUp className="w-3.5 h-3.5" />} 
        value={pipelineValue} 
        color="text-cyan-400"
      />
      
      <div className="w-px h-4 bg-border" />
      
      <StatItem 
        icon={<Dumbbell className="w-3.5 h-3.5" />} 
        value={`${yogaClasses} classes`} 
        color="text-orange-400"
      />
      
      <div className="w-px h-4 bg-border" />
      
      <StatItem 
        icon={<Film className="w-3.5 h-3.5" />} 
        value={`${watchlistCount} watchlist`} 
        color="text-pink-400"
      />
      
      <div className="w-px h-4 bg-border" />
      
      <StatItem 
        icon={<Award className="w-3.5 h-3.5" />} 
        value={`${buddyPasses} buddy`} 
        color={buddyPassDays <= 7 ? 'text-red-400' : buddyPassDays <= 14 ? 'text-yellow-400' : 'text-gray-400'}
        alert={buddyPassDays <= 14}
      />
    </div>
  );
}

function StatItem({ 
  icon, 
  value, 
  color,
  alert = false 
}: { 
  icon: React.ReactNode; 
  value: string; 
  color: string;
  alert?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${color} ${alert ? 'animate-pulse' : ''}`}>
      {icon}
      <span className="font-medium">{value}</span>
    </div>
  );
}
