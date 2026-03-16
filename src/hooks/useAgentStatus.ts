import { useState, useEffect, useCallback } from 'react';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  level: number;
  status: 'running' | 'idle' | 'error' | 'offline' | 'weekend';
  lastActive: string;
}

interface AgentSystemStatus {
  agents: Agent[];
  openclaw: {
    gateway: string;
    nodes: number;
    sessions: number;
  };
  timestamp: string;
}

export function useAgentStatus() {
  const [data, setData] = useState<AgentSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/status');
      if (res.ok) {
        const data = await res.json();
        setData(data);
        setError(null);
      } else {
        setError('Failed to fetch agent status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { data, loading, error, refresh: fetchStatus };
}
