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

  // Toggle with Cmd+K
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
  const [staleDeals, setStaleDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<{ lastSync: string | null; status: string }>({ lastSync: null, status: 'idle' });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [
        { data: agentsData },
        { data: emailsData },
        { data: pipelineData },
        { data: staleData },
        { data: activitiesData },
        { data: eventsData },
        { data: syncData }
      ] = await Promise.all([
        supabase.from('agent_status').select('*').order('updated_at', { ascending: false }),
        supabase.from('email_categories').select('*').order('received_at', { ascending: false }).limit(20),
        supabase.from('pipeline_cache').select('*'),
        supabase.from('stale_deals').select('*').order('daysStale', { ascending: false }),
        supabase.from('clawd_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('calendar_events').select('*').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(10),
        supabase.from('sync_status').select('*').order('last_sync_at', { ascending: false }).limit(1).single()
      ]);

      // Process pipeline data
      if (pipelineData) {
        const total = pipelineData.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
        const byStage = pipelineData.reduce((acc: any, deal: any) => {
          const stage = deal.stageName || 'Unknown';
          if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
          acc[stage].count++;
          acc[stage].value += deal.amount || 0;
          return acc;
        }, {} as Record<string, { count: number; value: number }>);
        setPipeline({ deals: pipelineData, total, byStage });
      }

      setAgents(agentsData || []);
      setEmails(emailsData || []);
      setStaleDeals(staleData || []);
      setActivities(activitiesData || []);
      setCalendarEvents(eventsData || []);
      
      if (syncData) {
        setSyncStatus({
          lastSync: syncData.last_sync_at,
          status: syncData.status
        });
      }
      
      setLastRefresh(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, []);

  // Initial fetch - client side only
  useEffect(() => {
    // Force immediate fetch on mount
    fetchData();
    
    // Also fetch after a short delay to ensure Supabase client is ready
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Real-time subscriptions
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
      supabase.channel('activities')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clawd_logs' }, fetchData)
        .subscribe()
    ];

    return () => channels.forEach(ch => ch.unsubscribe());
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { 
    agents, emails, pipeline, staleDeals, activities, calendarEvents, syncStatus,
    loading, lastRefresh, refresh: fetchData 
  };
}

export function useAgentActions() {
  const spawnAgent = async (agentType: string, task: string) => {
    // Log to activity
    await supabase.from('clawd_logs').insert({
      agent: 'work-agent',
      action: `Spawned ${agentType} for: ${task}`,
      status: 'info',
      details: { spawned: agentType, task }
    });
    return true;
  };

  const refreshAgent = async (agentId: string) => {
    await supabase.from('clawd_logs').insert({
      agent: agentId,
      action: 'Manual refresh triggered',
      status: 'info'
    });
    return true;
  };

  return { spawnAgent, refreshAgent };
}
