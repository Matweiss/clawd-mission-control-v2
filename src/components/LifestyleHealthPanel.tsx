import React, { useState, useEffect } from 'react';
import { Heart, Moon, Footprints, Smartphone, Wind, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { AppleHealthSetupModal } from './AppleHealthSetupModal';

interface HealthMetric {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export function LifestyleHealthPanel() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([
    {
      type: 'sleep',
      value: 6.2,
      unit: 'hours',
      timestamp: new Date().toISOString(),
      trend: 'down',
      status: 'warning'
    },
    {
      type: 'hrv',
      value: 42,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      trend: 'down',
      status: 'warning'
    },
    {
      type: 'steps',
      value: 8432,
      unit: 'steps',
      timestamp: new Date().toISOString(),
      trend: 'stable',
      status: 'good'
    },
    {
      type: 'screen_time',
      value: 8.5,
      unit: 'hours',
      timestamp: new Date().toISOString(),
      trend: 'up',
      status: 'warning'
    }
  ]);

  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    // Check if health data exists
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/latest');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || metrics);
        setConnected(true);
        setLastSync(data.lastSync);
      }
    } catch (err) {
      console.log('Health data not yet connected');
    }
  };

  const getMetricIcon = (type: string) => {
    switch(type) {
      case 'sleep': return <Moon className="w-4 h-4" />;
      case 'hrv': return <Heart className="w-4 h-4" />;
      case 'steps': return <Footprints className="w-4 h-4" />;
      case 'screen_time': return <Smartphone className="w-4 h-4" />;
      case 'mindful': return <Wind className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const formatMetricName = (type: string) => {
    const names: any = {
      sleep: 'Sleep',
      hrv: 'HRV (Stress)',
      steps: 'Steps',
      screen_time: 'Screen Time',
      mindful: 'Mindful Minutes'
    };
    return names[type] || type;
  };

  return (
    <div className="bg-surface border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Heart className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Lifestyle Agent</h2>
            <p className="text-xs text-gray-500">{connected ? 'Health data connected' : 'Set up Apple Health'}</p>
          </div>
        </div>
        
        {connected ? (
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            <span>Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-yellow-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Setup needed</span>
          </div>
        )}
      </div>

      {!connected ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-3">Connect Apple Health for proactive wellness monitoring</p>
          <button 
            onClick={() => setShowSetupModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            Set Up iPhone Integration
          </button>
          
          <AppleHealthSetupModal 
            isOpen={showSetupModal} 
            onClose={() => setShowSetupModal(false)} 
          />
        </div>
      ) : (
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div key={metric.type} className="flex items-center justify-between p-2 bg-surface-light rounded-lg">
              <div className="flex items-center gap-2">
                <div className={getStatusColor(metric.status)}>
                  {getMetricIcon(metric.type)}
                </div>
                <span className="text-sm text-gray-300">{formatMetricName(metric.type)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                  {metric.value} {metric.unit}
                </span>
                <span className="text-xs text-gray-500">
                  {getTrendIcon(metric.trend)}
                </span>
              </div>
            </div>
          ))}
          
          {lastSync && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Last sync: {new Date(lastSync).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}

      {/* Quick Wellness Actions */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-surface-light rounded-lg text-xs text-gray-300 hover:bg-border transition-colors">
            <Wind className="w-3 h-3" />
            Log Breathing
          </button>
          
          <button className="flex items-center gap-2 px-3 py-2 bg-surface-light rounded-lg text-xs text-gray-300 hover:bg-border transition-colors">
            <Moon className="w-3 h-3" />
            Log Sleep
          </button>
        </div>
      </div>
    </div>
  );
}
