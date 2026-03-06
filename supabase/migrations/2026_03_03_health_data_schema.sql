-- Health Data Schema for Lifestyle Agent v2
-- Run this in Supabase SQL Editor

-- Table: health_data
-- Stores all incoming health metrics from Apple Health
CREATE TABLE IF NOT EXISTS health_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  data_type TEXT NOT NULL, -- 'sleep', 'hrv', 'steps', 'mindful', 'screen_time', 'resting_hr'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  source TEXT DEFAULT 'apple_health',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast queries
  CONSTRAINT valid_data_type CHECK (data_type IN ('sleep', 'hrv', 'steps', 'mindful', 'screen_time', 'resting_hr', 'active_energy'))
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_health_data_user_timestamp ON health_data(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_data_type ON health_data(data_type);

-- Table: health_baselines
-- Stores user's personal averages for comparison
CREATE TABLE IF NOT EXISTS health_baselines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  metric TEXT NOT NULL, -- 'sleep', 'hrv', 'steps', etc.
  avg_value NUMERIC NOT NULL,
  min_value NUMERIC,
  max_value NUMERIC,
  sample_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, metric)
);

-- Table: pending_alerts
-- Queue for lifestyle agent to process
CREATE TABLE IF NOT EXISTS pending_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  alert_type TEXT NOT NULL, -- 'sleepWarning', 'stressSpike', 'morningCheckin', etc.
  context JSONB NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'dismissed', 'acknowledged'
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_alerts_status ON pending_alerts(status, scheduled_for);

-- Table: health_flags
-- Temporary flags for pattern detection
CREATE TABLE IF NOT EXISTS health_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  flag_type TEXT NOT NULL,
  value NUMERIC,
  flag_date DATE DEFAULT CURRENT_DATE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: lifestyle_checkins
-- Log of all check-ins and responses
CREATE TABLE IF NOT EXISTS lifestyle_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  checkin_type TEXT NOT NULL, -- 'morning', 'midday', 'evening', 'pattern', 'crisis'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response_action TEXT, -- what button they clicked
  response_text TEXT, -- if they typed something
  was_helpful BOOLEAN,
  
  INDEX idx_checkins_user_date ON user_id, DATE(sent_at)
);

-- Function: Calculate baseline averages (run weekly)
CREATE OR REPLACE FUNCTION calculate_health_baselines(p_user_id TEXT DEFAULT 'default')
RETURNS void AS $$
BEGIN
  -- Sleep baseline
  INSERT INTO health_baselines (user_id, metric, avg_value, min_value, max_value, sample_count)
  SELECT 
    p_user_id,
    'sleep' as metric,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count
  FROM health_data
  WHERE user_id = p_user_id 
    AND data_type = 'sleep'
    AND timestamp > NOW() - INTERVAL '14 days'
  ON CONFLICT (user_id, metric) DO UPDATE SET
    avg_value = EXCLUDED.avg_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    sample_count = EXCLUDED.sample_count,
    calculated_at = NOW();

  -- HRV baseline
  INSERT INTO health_baselines (user_id, metric, avg_value, min_value, max_value, sample_count)
  SELECT 
    p_user_id,
    'hrv' as metric,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count
  FROM health_data
  WHERE user_id = p_user_id 
    AND data_type = 'hrv'
    AND timestamp > NOW() - INTERVAL '14 days'
  ON CONFLICT (user_id, metric) DO UPDATE SET
    avg_value = EXCLUDED.avg_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    sample_count = EXCLUDED.sample_count,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_checkins ENABLE ROW LEVEL SECURITY;

-- Policies (allow service role full access)
CREATE POLICY "Service role full access" ON health_data FOR ALL USING (true);
CREATE POLICY "Service role full access" ON health_baselines FOR ALL USING (true);
CREATE POLICY "Service role full access" ON pending_alerts FOR ALL USING (true);
CREATE POLICY "Service role full access" ON health_flags FOR ALL USING (true);
CREATE POLICY "Service role full access" ON lifestyle_checkins FOR ALL USING (true);

-- Done!
SELECT 'Health data schema created successfully' as status;
