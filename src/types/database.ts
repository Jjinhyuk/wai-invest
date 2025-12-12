// Database types for Supabase

export type UserRole = 'user' | 'admin';
export type JobType = 'import_tickers' | 'update_metrics' | 'update_prices' | 'backfill_missing';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Ticker {
  symbol: string;
  name: string;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceDaily {
  symbol: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface FundamentalsAnnual {
  symbol: string;
  fiscal_date: string;
  revenue: number | null;
  net_income: number | null;
  eps: number | null;
  shares_outstanding: number | null;
  total_debt: number | null;
  total_equity: number | null;
  free_cash_flow: number | null;
  operating_cash_flow: number | null;
}

export interface MetricsLatest {
  symbol: string;
  price: number | null;
  market_cap: number | null;
  pe: number | null;
  ps: number | null;
  pb: number | null;
  peg: number | null;
  roe: number | null;
  roic: number | null;
  fcf: number | null;
  fcf_margin: number | null;
  revenue_growth_yoy: number | null;
  eps_growth_yoy: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  beta: number | null;
  dividend_yield: number | null;
  week52_high: number | null;
  week52_low: number | null;
  score_quality: number | null;
  score_growth: number | null;
  score_value: number | null;
  score_risk: number | null;
  score_total: number | null;
  explain_text: string | null;
  as_of: string;
  updated_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WatchlistItem {
  watchlist_id: string;
  symbol: string;
  created_at: string;
}

export interface Holding {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  target_weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface AlertSettings {
  user_id: string;
  enabled: boolean;
  drawdown_min_percent: number;
  drawdown_max_percent: number;
  peg_max: number;
  min_score: number;
  delivery_time_kst: string;
  updated_at: string;
}

export interface AlertEvent {
  id: string;
  user_id: string;
  run_at: string;
  matched_count: number;
  payload: AlertPayload | null;
  email_sent: boolean;
  created_at: string;
}

export interface AlertPayload {
  symbols: string[];
  summary: string;
  criteria: {
    drawdown_range: [number, number];
    peg_max: number;
    min_score: number;
  };
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  total: number;
  done: number;
  failed: number;
  error_message: string | null;
  created_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface JobRun {
  id: string;
  job_id: string;
  symbol: string;
  status: JobStatus;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

// Extended types with joins
export interface TickerWithMetrics extends Ticker {
  metrics: MetricsLatest | null;
}

export interface HoldingWithMetrics extends Holding {
  ticker: Ticker;
  metrics: MetricsLatest | null;
  current_value?: number;
  gain_loss?: number;
  gain_loss_percent?: number;
  weight?: number;
}

export interface WatchlistWithItems extends Watchlist {
  items: (WatchlistItem & { ticker: Ticker; metrics: MetricsLatest | null })[];
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      tickers: {
        Row: Ticker;
        Insert: Omit<Ticker, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Ticker, 'symbol' | 'created_at'>>;
      };
      prices_daily: {
        Row: PriceDaily;
        Insert: PriceDaily;
        Update: Partial<PriceDaily>;
      };
      fundamentals_annual: {
        Row: FundamentalsAnnual;
        Insert: FundamentalsAnnual;
        Update: Partial<FundamentalsAnnual>;
      };
      metrics_latest: {
        Row: MetricsLatest;
        Insert: Omit<MetricsLatest, 'updated_at'>;
        Update: Partial<Omit<MetricsLatest, 'symbol'>>;
      };
      watchlists: {
        Row: Watchlist;
        Insert: Omit<Watchlist, 'id' | 'created_at'>;
        Update: Partial<Omit<Watchlist, 'id' | 'user_id' | 'created_at'>>;
      };
      watchlist_items: {
        Row: WatchlistItem;
        Insert: Omit<WatchlistItem, 'created_at'>;
        Update: never;
      };
      holdings: {
        Row: Holding;
        Insert: Omit<Holding, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Holding, 'id' | 'user_id' | 'created_at'>>;
      };
      alert_settings: {
        Row: AlertSettings;
        Insert: Omit<AlertSettings, 'updated_at'>;
        Update: Partial<Omit<AlertSettings, 'user_id'>>;
      };
      alert_events: {
        Row: AlertEvent;
        Insert: Omit<AlertEvent, 'id' | 'created_at'>;
        Update: never;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at'>;
        Update: Partial<Omit<Job, 'id' | 'created_at'>>;
      };
      job_runs: {
        Row: JobRun;
        Insert: Omit<JobRun, 'id'>;
        Update: Partial<Omit<JobRun, 'id' | 'job_id'>>;
      };
    };
  };
}
