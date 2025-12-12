// Stock data provider interface types

export interface ProviderTicker {
  symbol: string;
  name: string;
  exchange: string | null;
  sector: string | null;
  industry: string | null;
}

export interface ProviderQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  timestamp: string;
}

export interface ProviderMetrics {
  symbol: string;
  price: number | null;
  marketCap: number | null;
  pe: number | null;
  ps: number | null;
  pb: number | null;
  peg: number | null;
  roe: number | null;
  roic: number | null;
  fcf: number | null;
  fcfMargin: number | null;
  revenueGrowthYoy: number | null;
  epsGrowthYoy: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  beta: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
}

export interface ProviderFundamentals {
  symbol: string;
  fiscalDate: string;
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  sharesOutstanding: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  freeCashFlow: number | null;
  operatingCashFlow: number | null;
}

export interface IStockProvider {
  name: string;

  // Get list of all US tickers
  listTickers(): Promise<ProviderTicker[]>;

  // Get real-time quote
  getQuote(symbol: string): Promise<ProviderQuote | null>;

  // Get key metrics for scoring
  getMetrics(symbol: string): Promise<ProviderMetrics | null>;

  // Get annual fundamentals (optional)
  getFundamentalsAnnual?(symbol: string): Promise<ProviderFundamentals[]>;
}
