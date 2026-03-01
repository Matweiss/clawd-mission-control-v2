import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, search, setSearch, results, setResults };
}

export function useRealtimeData() {
  const [agents, setAgents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<{ deals: any[]; total: number; byStage: Record<string, { count: number; value: number }> }>({ deals: [], total: 0, byStage: {} });
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    console.log('🔍 Fetching data from Supabase...');
    setLoading(true);
    
    try {
      // Only query tables that exist
      const { data: agentsData, error: agentsError } = await supabase
        .from('agent_status')
        .select('agent_id,status,success_rate,last_task,updated_at')
        .order('updated_at', { ascending: false });
      
      if (agentsError) console.error('Agents error:', agentsError);

      const { data: emailsData, error: emailsError } = await supabase
        .from('email_categories')
        .select('message_id,from_email,from_name,subject,category,received_at,snippet')
        .order('received_at', { ascending: false })
        .limit(20);
      
      if (emailsError) console.error('Emails error:', emailsError);

      const { data: pipelineData, error: pipelineError } = await supabase
        .from('pipeline_cache')
        .select('deal_id,name,amount,stage_name,close_date');
      
      if (pipelineError) console.error('Pipeline error:', pipelineError);

      const { data: calendarData, error: calendarError } = await supabase
        .from('calendar_events')
        .select('id,summary,start_time,end_time,attendees,meet_link,location')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);
      
      if (calendarError) console.error('Calendar error:', calendarError);

      console.log('📊 Fetched:', {
        agents: agentsData?.length || 0,
        emails: emailsData?.length || 0,
        pipeline: pipelineData?.length || 0,
        calendar: calendarData?.length || 0,
      });

      // Process pipeline data
      if (pipelineData) {
        const total = pipelineData.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
        const byStage = pipelineData.reduce((acc: any, deal: any) => {
          const stage = deal.stage_name || 'Unknown';
          if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
          acc[stage].count++;
          acc[stage].value += deal.amount || 0;
          return acc;
        }, {} as Record<string, { count: number; value: number }>);
        setPipeline({ deals: pipelineData, total, byStage });
      }

      setAgents(agentsData || []);
      setEmails(emailsData || []);
      setCalendarEvents(calendarData || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Real-time subscriptions (only for tables that exist)
  useEffect(() => {
    const channels = [
      supabase.channel('agents')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_status' }, fetchData)
        .subscribe(),
      supabase.channel('emails')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'email_categories' }, fetchData)
        .subscribe(),
      supabase.channel('pipeline')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_cache' }, fetchData)
        .subscribe(),
    ];

    return () => channels.forEach(ch => ch.unsubscribe());
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { 
    agents, emails, pipeline, calendarEvents,
    loading, lastRefresh, refresh: fetchData 
  };
}

export function useAgentActions() {
  const spawnAgent = async (agentType: string, task: string) => {
    console.log('Spawn agent:', agentType, task);
    return true;
  };

  const refreshAgent = async (agentId: string) => {
    console.log('Refresh agent:', agentId);
    return true;
  };

  return { spawnAgent, refreshAgent };
}
