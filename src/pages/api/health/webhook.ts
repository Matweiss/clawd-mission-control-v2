// src/pages/api/health/webhook.ts
// Receives health data from Apple Health (via Shortcuts automation)

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify webhook secret
  const secret = req.headers['x-health-secret'];
  if (secret !== process.env.HEALTH_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthData = req.body;
    
    // Validate required fields
    if (!healthData.type || !healthData.timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store in Supabase
    const { data, error } = await supabase
      .from('health_data')
      .insert({
        user_id: healthData.userId || 'default',
        data_type: healthData.type, // 'sleep', 'hrv', 'steps', 'mindful'
        value: healthData.value,
        unit: healthData.unit,
        timestamp: healthData.timestamp,
        source: healthData.source || 'apple_health',
        metadata: healthData.metadata || {}
      })
      .select('id')
      .single();

    if (error) throw error;

    // Check thresholds and trigger alerts if needed
    await checkThresholds(healthData);

    res.status(200).json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Health webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function checkThresholds(data: any) {
  // Get user's baseline averages
  const { data: baseline } = await supabase
    .from('health_baselines')
    .select('*')
    .eq('user_id', data.userId || 'default')
    .single();

  switch (data.type) {
    case 'sleep':
      if (data.value < 6) {
        // Trigger sleep warning
        await triggerAlert('sleepWarning', {
          sleepHours: data.value,
          avg3Night: baseline?.avg_sleep || 7
        });
      }
      break;
    
    case 'hrv':
      const dropPercent = baseline?.avg_hrv 
        ? ((baseline.avg_hrv - data.value) / baseline.avg_hrv) * 100 
        : 0;
      
      if (dropPercent > 25) {
        await triggerAlert('stressSpike', {
          hrvDrop: Math.round(dropPercent)
        });
      }
      break;

    case 'screen_time':
      if (data.value > 10) {
        // Log for evening check-in
        await supabase.from('health_flags').insert({
          user_id: data.userId || 'default',
          flag_type: 'high_screen_time',
          value: data.value
        });
      }
      break;
  }
}

async function triggerAlert(type: string, context: any) {
  // Queue alert for Lifestyle Agent
  await supabase.from('pending_alerts').insert({
    alert_type: type,
    context: context,
    status: 'pending',
    priority: type === 'stressSpike' ? 'high' : 'normal'
  });
}
