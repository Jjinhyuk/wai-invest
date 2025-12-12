-- WAI-Invest Database Schema
-- Initial Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- 1. PROFILES (User data synced with auth.users)
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
      THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- 2. TICKERS (Stock master data)
-- =====================
CREATE TABLE IF NOT EXISTS tickers (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT,
  sector TEXT,
  industry TEXT,
  country TEXT DEFAULT 'US',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickers_sector ON tickers(sector);
CREATE INDEX idx_tickers_industry ON tickers(industry);
CREATE INDEX idx_tickers_active ON tickers(is_active);

-- =====================
-- 3. PRICES_DAILY (Historical price data)
-- =====================
CREATE TABLE IF NOT EXISTS prices_daily (
  symbol TEXT NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
  date DATE NOT NULL,
  open NUMERIC(12,4),
  high NUMERIC(12,4),
  low NUMERIC(12,4),
  close NUMERIC(12,4),
  volume BIGINT,
  PRIMARY KEY (symbol, date)
);

CREATE INDEX idx_prices_daily_date ON prices_daily(date DESC);

-- =====================
-- 4. FUNDAMENTALS_ANNUAL (Annual financial data)
-- =====================
CREATE TABLE IF NOT EXISTS fundamentals_annual (
  symbol TEXT NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
  fiscal_date DATE NOT NULL,
  revenue NUMERIC(18,2),
  net_income NUMERIC(18,2),
  eps NUMERIC(12,4),
  shares_outstanding BIGINT,
  total_debt NUMERIC(18,2),
  total_equity NUMERIC(18,2),
  free_cash_flow NUMERIC(18,2),
  operating_cash_flow NUMERIC(18,2),
  PRIMARY KEY (symbol, fiscal_date)
);

-- =====================
-- 5. METRICS_LATEST (Snapshot of latest metrics - most used table)
-- =====================
CREATE TABLE IF NOT EXISTS metrics_latest (
  symbol TEXT PRIMARY KEY REFERENCES tickers(symbol) ON DELETE CASCADE,
  price NUMERIC(12,4),
  market_cap NUMERIC(18,2),
  pe NUMERIC(12,4),
  ps NUMERIC(12,4),
  pb NUMERIC(12,4),
  peg NUMERIC(12,4),
  roe NUMERIC(8,4),
  roic NUMERIC(8,4),
  fcf NUMERIC(18,2),
  fcf_margin NUMERIC(8,4),
  revenue_growth_yoy NUMERIC(8,4),
  eps_growth_yoy NUMERIC(8,4),
  gross_margin NUMERIC(8,4),
  operating_margin NUMERIC(8,4),
  net_margin NUMERIC(8,4),
  debt_to_equity NUMERIC(8,4),
  current_ratio NUMERIC(8,4),
  beta NUMERIC(8,4),
  dividend_yield NUMERIC(8,4),
  week52_high NUMERIC(12,4),
  week52_low NUMERIC(12,4),
  -- Calculated scores (stored, not computed on read)
  score_quality NUMERIC(5,2),
  score_growth NUMERIC(5,2),
  score_value NUMERIC(5,2),
  score_risk NUMERIC(5,2),
  score_total NUMERIC(5,2),
  explain_text TEXT,
  as_of TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metrics_latest_score ON metrics_latest(score_total DESC);
CREATE INDEX idx_metrics_latest_as_of ON metrics_latest(as_of);

-- =====================
-- 6. WATCHLISTS (User's stock watchlists)
-- =====================
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON watchlists(user_id);

-- =====================
-- 7. WATCHLIST_ITEMS (Stocks in watchlists)
-- =====================
CREATE TABLE IF NOT EXISTS watchlist_items (
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (watchlist_id, symbol)
);

-- =====================
-- 8. HOLDINGS (User portfolio holdings)
-- =====================
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES tickers(symbol) ON DELETE CASCADE,
  quantity NUMERIC(18,8) NOT NULL,
  avg_price NUMERIC(12,4) NOT NULL,
  target_weight NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, symbol)
);

CREATE INDEX idx_holdings_user ON holdings(user_id);

-- =====================
-- 9. ALERT_SETTINGS (User alert preferences)
-- =====================
CREATE TABLE IF NOT EXISTS alert_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  drawdown_min_percent NUMERIC(5,2) DEFAULT 20,
  drawdown_max_percent NUMERIC(5,2) DEFAULT 50,
  peg_max NUMERIC(5,2) DEFAULT 1.5,
  min_score NUMERIC(5,2) DEFAULT 60,
  delivery_time_kst TIME DEFAULT '08:00:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- 10. ALERT_EVENTS (Alert history)
-- =====================
CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  matched_count INTEGER DEFAULT 0,
  payload JSONB,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_events_user ON alert_events(user_id);
CREATE INDEX idx_alert_events_run_at ON alert_events(run_at DESC);

-- =====================
-- 11. JOBS (Admin batch job management)
-- =====================
CREATE TYPE job_type AS ENUM ('import_tickers', 'update_metrics', 'update_prices', 'backfill_missing');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  total INTEGER DEFAULT 0,
  done INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =====================
-- 12. JOB_RUNS (Individual job run records)
-- =====================
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_job_runs_job_id ON job_runs(job_id);
CREATE INDEX idx_job_runs_status ON job_runs(status);

-- =====================
-- RLS (Row Level Security) Policies
-- =====================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundamentals_annual ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_latest ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Public data tables: Everyone can read tickers and metrics
CREATE POLICY "Anyone can view tickers" ON tickers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view prices" ON prices_daily
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view fundamentals" ON fundamentals_annual
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view metrics" ON metrics_latest
  FOR SELECT USING (true);

-- Watchlists: Users can only access their own
CREATE POLICY "Users can view own watchlists" ON watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlists" ON watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists" ON watchlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists" ON watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlist items: Users can manage items in their watchlists
CREATE POLICY "Users can view own watchlist items" ON watchlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own watchlist items" ON watchlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own watchlist items" ON watchlist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM watchlists WHERE id = watchlist_id AND user_id = auth.uid())
  );

-- Holdings: Users can only access their own
CREATE POLICY "Users can view own holdings" ON holdings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings" ON holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings" ON holdings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings" ON holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Alert settings: Users can only access their own
CREATE POLICY "Users can view own alert settings" ON alert_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert settings" ON alert_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert settings" ON alert_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Alert events: Users can only view their own
CREATE POLICY "Users can view own alert events" ON alert_events
  FOR SELECT USING (auth.uid() = user_id);

-- Jobs: Only admins can access
CREATE POLICY "Admins can view all jobs" ON jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Job runs: Only admins can access
CREATE POLICY "Admins can view all job runs" ON job_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert job runs" ON job_runs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update job runs" ON job_runs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin policies for data management
CREATE POLICY "Admins can manage tickers" ON tickers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage prices" ON prices_daily
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage fundamentals" ON fundamentals_annual
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage metrics" ON metrics_latest
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickers_updated_at
  BEFORE UPDATE ON tickers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_latest_updated_at
  BEFORE UPDATE ON metrics_latest
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_settings_updated_at
  BEFORE UPDATE ON alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
