import React, { useState, useEffect } from 'react';
import { Heart, Moon, Wind, Smartphone, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface HealthData {
  sleep?: { value: number; unit: string; quality: 'good' | 'fair' | 'poor' };
  hrv?: { value: number; unit: string; status: 'good' | 'warning' | 'critical' };
  steps?: { value: number; goal: number };
  mindful?: { value: number; goal: number };
}

export function LifestyleHealthPanel() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    checkHealthConnection();
  }, []);

  const checkHealthConnection = async () => {
    try {
      // Try to fetch from Apple Health API
      const res = await fetch('/api/health/latest');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setConnected(true);
        setLastSync(new Date().toISOString());
      } else {
        setConnected(false);
      }
    } catch (err) {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good':
        return 'text-green-400';
      case 'warning':
      case 'fair':
        return 'text-yellow-400';
      case 'critical':
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-surface border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Lifestyle Agent</h2>
              <p className="text-xs text-gray-500">Health data not connected</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Setup needed</span>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-3">Connect Apple Health for wellness monitoring</p>
          <button
            onClick={() => alert('Apple Health integration requires iOS Shortcuts setup. See AGENT-BOOTSTRAP-PROMPT.md for instructions.')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            Set Up iPhone Integration
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-gray-500 mb-2">Manual Entry</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => alert('Breathing exercise logged! 🧘')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-light rounded-lg text-xs text-gray-300 hover:bg-border transition-colors"
            >
              <Wind className="w-3 h-3" />
              Log Breathing
            </button>
            <button
              onClick={() => alert('Sleep logged! 🌙')}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-light rounded-lg text-xs text-gray-300 hover:bg-border transition-colors"
            >
              <Moon className="w-3 h-3" />
              Log Sleep
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Lifestyle Agent</h2>
            <p className="text-xs text-gray-500">Apple Health connected</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-green-400 text-xs">
          <CheckCircle className="w-3 h-3" />
          <span>Active</span>
        </div>
      </div>

      <div className="space-y-2">
        {healthData?.sleep && (
          <div className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
            <div className="flex items-center gap-2">
              <Moon className={`w-4 h-4 ${getStatusColor(healthData.sleep.quality)}`} />
              <span className="text-sm text-gray-300">Sleep</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(healthData.sleep.quality)}`}>
              {healthData.sleep.value} {healthData.sleep.unit}
            </span>
          </div>
        )}

        {healthData?.hrv && (
          <div className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${getStatusColor(healthData.hrv.status)}`} />
              <span className="text-sm text-gray-300">HRV</span>
            </div>
            <span className={`text-sm font-medium ${getStatusColor(healthData.hrv.status)}`}>
              {healthData.hrv.value} {healthData.hrv.unit}
            </span>
          </div>
        )}

        {healthData?.steps && (
          <div className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Steps</span>
            </div>
            <span className="text-sm font-medium text-green-400">
              {healthData.steps.value.toLocaleString()} / {healthData.steps.goal.toLocaleString()}
            </span>
          </div>
        )}

        {healthData?.mindful && (
          <div className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Mindful</span>
            </div>
            <span className="text-sm font-medium text-blue-400">
              {healthData.mindful.value} / {healthData.mindful.goal} min
            </span>
          </div>
        )}
      </div>

      {lastSync && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Last sync: {new Date(lastSync).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}
