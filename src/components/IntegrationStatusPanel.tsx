import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface DataQuality {
  status?: 'complete' | 'partial' | 'unavailable';
  isPartial?: boolean;
  message?: string;
}

interface IntegrationStatus {
  name: string;
  status: 'healthy' | 'stale' | 'error' | 'unknown';
  lastSync: string | null;
  latency?: number;
  error?: string;
}

async function readDataQuality(response: Response): Promise<DataQuality | null> {
  try {
    const clone = response.clone();
    const body = await clone.json();
    return body?.dataQuality || null;
  } catch {
    return null;
  }
}

function statusFromResponse(response: Response, dataQuality: DataQuality | null): IntegrationStatus['status'] {
  if (!response.ok || dataQuality?.status === 'unavailable') return 'error';
  if (dataQuality?.isPartial || dataQuality?.status === 'partial') return 'stale';
  return 'healthy';
}

export function IntegrationStatusPanel() {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkAll = async () => {
    setLoading(true);
    const checks: IntegrationStatus[] = [];

    // Check Calendar
    try {
      const start = Date.now();
      const calRes = await fetch('/api/calendar/meetings');
      const dataQuality = await readDataQuality(calRes);
      const status = statusFromResponse(calRes, dataQuality);
      checks.push({
        name: 'Calendar',
        status,
        lastSync: calRes.ok ? new Date().toISOString() : null,
        latency: Date.now() - start,
        error: status !== 'healthy' ? (dataQuality?.message || `HTTP ${calRes.status}`) : undefined
      });
    } catch (e) {
      checks.push({ name: 'Calendar', status: 'error', lastSync: null, error: 'Network error' });
    }

    // Check Gmail
    try {
      const start = Date.now();
      const emailRes = await fetch('/api/emails/recent');
      const dataQuality = await readDataQuality(emailRes);
      const status = statusFromResponse(emailRes, dataQuality);
      checks.push({
        name: 'Gmail',
        status,
        lastSync: emailRes.ok ? new Date().toISOString() : null,
        latency: Date.now() - start,
        error: status !== 'healthy' ? (dataQuality?.message || `HTTP ${emailRes.status}`) : undefined
      });
    } catch (e) {
      checks.push({ name: 'Gmail', status: 'error', lastSync: null, error: 'Network error' });
    }

    // Check Pipeline (Sheet)
    try {
      const start = Date.now();
      const pipeRes = await fetch('/api/pipeline/sheet');
      const dataQuality = await readDataQuality(pipeRes);
      const status = statusFromResponse(pipeRes, dataQuality);
      checks.push({
        name: 'Pipeline (Sheet)',
        status,
        lastSync: pipeRes.ok ? new Date().toISOString() : null,
        latency: Date.now() - start,
        error: status !== 'healthy' ? (dataQuality?.message || `HTTP ${pipeRes.status}`) : undefined
      });
    } catch (e) {
      checks.push({ name: 'Pipeline (Sheet)', status: 'error', lastSync: null, error: 'Network error' });
    }

    // Check HubSpot
    try {
      const start = Date.now();
      const hubspotRes = await fetch('/api/hubspot/status');
      const dataQuality = await readDataQuality(hubspotRes);
      const status = statusFromResponse(hubspotRes, dataQuality);
      checks.push({
        name: 'HubSpot',
        status,
        lastSync: hubspotRes.ok ? new Date().toISOString() : null,
        latency: Date.now() - start,
        error: status !== 'healthy' ? (dataQuality?.message || `HTTP ${hubspotRes.status}`) : undefined
      });
    } catch (e) {
      checks.push({ name: 'HubSpot', status: 'error', lastSync: null, error: 'Network error' });
    }

    // Check HA
    try {
      const start = Date.now();
      const haRes = await fetch('/api/ha/presence');
      const dataQuality = await readDataQuality(haRes);
      const status = statusFromResponse(haRes, dataQuality);
      checks.push({
        name: 'Home Assistant',
        status,
        lastSync: haRes.ok ? new Date().toISOString() : null,
        latency: Date.now() - start,
        error: status !== 'healthy' ? (dataQuality?.message || `HTTP ${haRes.status}`) : undefined
      });
    } catch (e) {
      checks.push({ name: 'Home Assistant', status: 'error', lastSync: null, error: 'Network error' });
    }

    setStatuses(checks);
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkAll();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'stale': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'stale': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return 'Never';
    const date = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Integration Status</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastCheck && (
            <span className="text-xs text-gray-500">
              Checked {formatTime(lastCheck.toISOString())}
            </span>
          )}
          <button 
            onClick={checkAll}
            className="p-1 hover:bg-surface-light rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {statuses.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Checking integrations...</p>
          </div>
        )}

        {statuses.map((status) => (
          <div key={status.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.status)}
              <div>
                <div className="text-sm">{status.name}</div>
                <div className={`text-xs ${getStatusColor(status.status)}`}>
                  {status.status === 'healthy' && status.latency && `${status.latency}ms`}
                  {(status.status === 'error' || status.status === 'stale') && status.error}
                  {status.status === 'healthy' && !status.latency && 'OK'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Last sync</div>
              <div className="text-xs">{formatTime(status.lastSync)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
