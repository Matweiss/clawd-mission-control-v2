-- SECURITY FIX: Enable RLS on all tables
-- Run this in Supabase SQL Editor to fix security errors

-- 1. Enable RLS on all tables
ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tone_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stale_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE clawd_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for authenticated access
-- Allow read access to authenticated users
CREATE POLICY "Allow read for authenticated" ON email_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON pipeline_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON stale_deals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON agent_status
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON cron_executions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON api_health
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON clawd_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated" ON forecast_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Allow insert/update for service role (agents)
CREATE POLICY "Allow all for service role" ON email_categories
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON pipeline_cache
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON stale_deals
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON agent_status
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON tasks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON cron_executions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON api_health
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON clawd_logs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON forecast_snapshots
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON agent_alerts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON email_tone_training
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON deal_contacts
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow all for service role" ON cache_status
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4. Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'email_categories',
  'pipeline_cache', 
  'stale_deals',
  'agent_status',
  'tasks',
  'cron_executions',
  'api_health',
  'clawd_logs',
  'deal_contacts',
  'kb_companies'
);
