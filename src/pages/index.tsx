import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { 
  Activity, Mail, Database, Cpu, Sparkles, 
  Zap, Calendar, TrendingUp, AlertCircle,
  CheckCircle, Clock, RefreshCw, MoreHorizontal,
  Command, Search, Settings, Bell
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Agent configuration
const AGENTS = [
  { id: 'work', name: 'Work Agent', emoji: '🤖', color: 'work', role: 'Orchestrator' },
  { id: 'build', name: 'Build Agent', emoji: '🔧', color: 'build', role: 'Engineering' },
  { id: 'research', name: 'Research Agent', emoji: '🔍', color: 'research', role: 'Intelligence' },
  { id: 'lifestyle', name: 'Lifestyle Agent', emoji: '🧘', color: 'lifestyle', role: 'Wellness' },
  { id: 'email', name: 'Email Agent', emoji: '📧', color: 'email', role: 'Inbox Monitor' },
  { id: 'hubspot', name: 'HubSpot Agent', emoji: '📊', color: 'hubspot', role: 'CRM Data' },
];

export default function MissionControl() {
  const [currentTime, setCurrentTime] = useState('');
  const [agents, setAgents] = useState([]);
  const [emails, setEmails] = useState([]);
  const [pipeline, setPipeline] = useState({ total: 0, deals: [], byStage: {} });
  const [staleDeals, setStaleDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const ptTime = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const ptDate = new Date().toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      setCurrentTime(`${ptDate} • ${ptTime} PT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch data
    fetchData();
    
    // Subscribe to realtime updates
    const subscriptions = setupSubscriptions();

    return () => {
      clearInterval(interval);
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  async function fetchData() {
    try {
      // Fetch agents
      const { data: agentData } = await supabase
        .from('agent_status')
        .select('*')
        .order('updated_at', { ascending: false });
      setAgents(agentData || []);

      // Fetch recent emails
      const { data: emailData } = await supabase
        .from('email_categories')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(10);
      setEmails(emailData || []);

      // Fetch pipeline
      const { data: pipelineData } = await supabase
        .from('pipeline_cache')
        .select('*');
      
      if (pipelineData) {
        const total = pipelineData.reduce((sum, d) => sum + (d.amount || 0), 0);
        const byStage = pipelineData.reduce((acc, deal) => {
          const stage = deal.stageName || 'Unknown';
          if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
          acc[stage].count++;
          acc[stage].value += deal.amount || 0;
          return acc;
        }, {});
        setPipeline({ total, deals: pipelineData, byStage });
      }

      // Fetch stale deals
      const { data: staleData } = await supabase
        .from('stale_deals')
        .select('*')
        .order('daysStale', { ascending: false })
        .limit(5);
      setStaleDeals(staleData || []);

      // Fetch activities
      const { data: activityData } = await supabase
        .from('clawd_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      setActivities(activityData || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  function setupSubscriptions() {
    const subs = [];
    
    subs.push(
      supabase.channel('agent-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_status' }, fetchData)
        .subscribe()
    );
    
    subs.push(
      supabase.channel('email-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'email_categories' }, fetchData)
        .subscribe()
    );

    return subs;
  }

  const urgentEmails = emails.filter(e => e.category === 'URGENT');
  const replyNeededEmails = emails.filter(e => e.category === 'REPLY_NEEDED');

  return (
    <div className="min-h-screen bg-background text-white">
      <Head>
        <title>Clawd Mission Control</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦞</span>
            <div>
              <h1 className="font-bold text-lg">Clawd Mission Control</h1>
              <p className="text-xs text-gray-400">AI Agent Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 font-mono">{currentTime}</span>
            <button className="p-2 hover:bg-surface-light rounded-lg transition-colors">
              <Command className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-surface-light rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              {urgentEmails.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-pulse" />
              )}
            </button>
            <button className="p-2 hover:bg-surface-light rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-work" />
        </div>
      ) : (
        <main className="max-w-[1800px] mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* LEFT COLUMN: AGENT SWARM */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Agents</h2>
                <span className="text-xs text-gray-500">{agents.length}/6 Online</span>
              </div>
              
              <div className="space-y-3">
                {AGENTS.map(agent => {
                  const agentData = agents.find(a => a.agent_id === agent.id);
                  const status = agentData?.status || 'offline';
                  
                  return (
                    <AgentCard 
                      key={agent.id}
                      agent={agent}
                      data={agentData}
                      status={status}
                    />
                  );
                })}
              </div>

              {/* Agent Communication Flow */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Agent Communication</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-email">📧</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-work">🤖</span>
                    <span className="text-gray-500">→</span>
                    <span>Mat (urgent alerts)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-hubspot">📊</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-work">🤖</span>
                    <span className="text-gray-500">→</span>
                    <span>Mat (pipeline insights)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: OPERATIONS HUB */}
            <div className="space-y-4">
              {/* Email Intelligence */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Email Intelligence</h2>
                  <button className="text-xs text-email hover:underline">Open Gmail</button>
                </div>
                
                <div className="p-4 space-y-3">
                  {urgentEmails.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-error text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>URGENT ({urgentEmails.length})</span>
                      </div>
                      {urgentEmails.slice(0, 2).map((email, i) => (
                        <EmailCard key={i} email={email} />
                      ))}
                    </div>
                  )}
                  
                  {replyNeededEmails.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-warning text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Reply Needed ({replyNeededEmails.length})</span>
                      </div>
                      {replyNeededEmails.slice(0, 2).map((email, i) => (
                        <EmailCard key={i} email={email} />
                      ))}
                    </div>
                  )}
                  
                  {emails.filter(e => e.category === 'FYI').length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-gray-500">
                        {emails.filter(e => e.category === 'FYI').length} FYI emails
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="px-4 py-3 border-t border-border flex gap-2">
                  <button className="flex-1 py-2 text-xs bg-surface-light hover:bg-border rounded-lg transition-colors">
                    Mark FYI Read
                  </button>
                  <button className="flex-1 py-2 text-xs bg-email/20 text-email hover:bg-email/30 rounded-lg transition-colors">
                    Draft Response
                  </button>
                </div>
              </div>

              {/* Task Kanban */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Tasks</h2>
                  <button className="text-xs bg-work/20 text-work px-2 py-1 rounded hover:bg-work/30 transition-colors">
                    + New
                  </button>
                </div>
                
                <div className="p-4 grid grid-cols-3 gap-3">
                  <TaskColumn title="HIGH" color="error" count={2} />
                  <TaskColumn title="MEDIUM" color="warning" count={1} />
                  <TaskColumn title="LOW" color="success" count={1} />
                </div>
              </div>

              {/* Cron Timeline */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Scheduled Operations</h2>
                <CronTimeline />
              </div>
            </div>

            {/* RIGHT COLUMN: INTELLIGENCE FEED */}
            <div className="space-y-4">
              {/* Pipeline Command */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sales Pipeline</h2>
                  <button className="p-1 hover:bg-surface-light rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono">{pipeline.deals.length}</div>
                      <div className="text-xs text-gray-500">Deals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono text-hubspot">
                        ${(pipeline.total / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-gray-500">Pipeline</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold font-mono text-success">3</div>
                      <div className="text-xs text-gray-500">This Week</div>
                    </div>
                  </div>

                  {/* By Stage */}
                  <div className="space-y-2 mb-4">
                    {Object.entries(pipeline.byStage).map(([stage, data]: [string, any]) => (
                      <div key={stage} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{data.count} deals</span>
                          <span className="font-mono text-gray-300">${(data.value / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Closing Soon */}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center gap-2 text-error mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Closing This Week</span>
                    </div>
                    <div className="bg-error/10 border border-error/30 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Clyde's Restaurant</span>
                        <span className="text-sm font-mono font-bold">$9,000</span>
                      </div>
                      <div className="text-xs text-error mt-1">Feb 28 (TOMORROW)</div>
                    </div>
                  </div>

                  {/* Stale Deals */}
                  {staleDeals.length > 0 && (
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex items-center gap-2 text-warning mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Stale Deals ({staleDeals.length})</span>
                      </div>
                      {staleDeals.slice(0, 3).map((deal, i) => (
                        <div key={i} className="text-xs py-1 flex items-center justify-between">
                          <span className="text-gray-400">{deal.name}</span>
                          <span className="text-warning">{deal.daysStale} days</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-border flex gap-2">
                  <button className="flex-1 py-2 text-xs bg-surface-light hover:bg-border rounded-lg transition-colors">
                    View Pipeline
                  </button>
                  <button className="flex-1 py-2 text-xs bg-hubspot/20 text-hubspot hover:bg-hubspot/30 rounded-lg transition-colors">
                    Refresh
                  </button>
                </div>
              </div>

              {/* API Health */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Integration Status</h2>
                <div className="grid grid-cols-2 gap-3">
                  <ApiStatus name="HubSpot" status="connected" latency={245} />
                  <ApiStatus name="Calendar" status="connected" latency={189} />
                  <ApiStatus name="Gmail" status="connected" latency={156} />
                  <ApiStatus name="Supabase" status="connected" latency={89} />
                  <ApiStatus name="ElevenLabs" status="connected" latency={334} />
                  <ApiStatus name="SearXNG" status="connected" latency={120} />
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Events</h2>
                </div>
                <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {activities.slice(0, 10).map((activity, i) => (
                    <ActivityItem key={i} activity={activity} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

// Component: Agent Card
function AgentCard({ agent, data, status }: any) {
  const colors: any = {
    work: 'border-work text-work',
    build: 'border-build text-build',
    research: 'border-research text-research',
    lifestyle: 'border-lifestyle text-lifestyle',
    email: 'border-email text-email',
    hubspot: 'border-hubspot text-hubspot',
  };

  const statusColors: any = {
    idle: 'bg-gray-500',
    running: 'bg-warning animate-pulse',
    error: 'bg-error',
    offline: 'bg-gray-700',
    weekend: 'bg-lifestyle',
  };

  return (
    <div className={`bg-surface border ${status === 'error' ? 'border-error' : 'border-border'} rounded-xl p-4 hover:border-gray-600 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl">{agent.emoji}</span>
            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${statusColors[status] || statusColors.idle}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${colors[agent.color].split(' ')[1]}`}>{agent.name}</h3>
            <p className="text-xs text-gray-500">{agent.role}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500 capitalize">{status}</span>
      </div>

      {data && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-mono">{data.success_rate || 0}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${colors[agent.color].split(' ')[1].replace('text-', 'bg-')}`}
              style={{ width: `${data.success_rate || 0}%` }}
            />
          </div>
          {data.last_task && (
            <p className="text-xs text-gray-500 truncate">{data.last_task}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-1.5 text-xs bg-surface-light hover:bg-border rounded transition-colors">
          View Logs
        </button>
        <button className="flex-1 py-1.5 text-xs bg-surface-light hover:bg-border rounded transition-colors">
          Spawn Task
        </button>
      </div>
    </div>
  );
}

// Component: Email Card
function EmailCard({ email }: any) {
  return (
    <div className="bg-surface-light rounded-lg p-3 border border-border">
      <div className="flex items-start justify-between mb-1">
        <span className="text-sm font-medium truncate">{email.from_name || email.from_email}</span>
        <span className="text-xs text-gray-500">
          {new Date(email.received_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm text-gray-400 truncate">{email.subject}</p>
      {email.deal_name && (
        <span className="inline-block mt-1 text-xs bg-work/20 text-work px-2 py-0.5 rounded">
          {email.deal_name}
        </span>
      )}
    </div>
  );
}

// Component: Task Column
function TaskColumn({ title, color, count }: any) {
  const colorClasses: any = {
    error: 'text-error border-error/30',
    warning: 'text-warning border-warning/30',
    success: 'text-success border-success/30',
  };

  return (
    <div className={`border rounded-lg p-2 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full bg-${color}`} />
        <span className="text-xs font-medium">{title}</span>
        <span className="text-xs text-gray-500">({count})</span>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-gray-500 py-2 text-center">None</div>
      </div>
    </div>
  );
}

// Component: Cron Timeline
function CronTimeline() {
  const jobs = [
    { time: '8:00 AM', name: 'Morning Briefing', status: 'completed' },
    { time: 'NOW', name: 'Email Agent Check', status: 'running' },
    { time: '12:00 PM', name: 'Pre-Meeting Prep', status: 'pending' },
    { time: '4:00 PM', name: 'HubSpot Cache Refresh', status: 'pending' },
    { time: '4:00 PM', name: 'Pipeline Check', status: 'pending' },
  ];

  return (
    <div className="space-y-3">
      {jobs.map((job, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            job.status === 'completed' ? 'bg-success' :
            job.status === 'running' ? 'bg-warning animate-pulse' :
            'bg-gray-600'
          }`} />
          <span className="text-xs text-gray-500 w-16">{job.time}</span>
          <span className="text-sm flex-1">{job.name}</span>
          <span className={`text-xs capitalize ${
            job.status === 'completed' ? 'text-success' :
            job.status === 'running' ? 'text-warning' :
            'text-gray-500'
          }`}>
            {job.status}
          </span>
        </div>
      ))}
    </div>
  );
}

// Component: API Status
function ApiStatus({ name, status, latency }: any) {
  return (
    <div className="flex items-center justify-between bg-surface-light rounded-lg p-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-success' : 'bg-error'}`} />
        <span className="text-xs">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{latency}ms</span>
        <span className="text-xs text-success">99.9%</span>
      </div>
    </div>
  );
}

// Component: Activity Item
function ActivityItem({ activity }: any) {
  const icons: any = {
    'email-agent': Mail,
    'hubspot-agent': Database,
    'work-agent': Cpu,
    'build-agent': Zap,
    'research-agent': Search,
  };

  const Icon = icons[activity.agent] || Activity;
  const timeAgo = new Date(activity.created_at).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit'
  });

  return (
    <div className="flex items-start gap-3 text-xs">
      <Icon className="w-4 h-4 text-gray-500 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{activity.agent?.replace('-agent', '')}</span>
          <span className="text-gray-600">{timeAgo}</span>
        </div>
        <p className="text-gray-300">{activity.action}</p>
      </div>
      {activity.status === 'success' && <CheckCircle className="w-3 h-3 text-success" />}
      {activity.status === 'error' && <AlertCircle className="w-3 h-3 text-error" />}
    </div>
  );
}
