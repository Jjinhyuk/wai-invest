// Financial Modeling Prep (FMP) API Provider
// Documentation: https://site.financialmodelingprep.com/developer/docs

import { z } from 'zod';
import {
  IStockProvider,
  ProviderTicker,
  ProviderQuote,
  ProviderMetrics,
  ProviderFundamentals,
} from './types';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Zod schemas for API response validation
const FMPTickerSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchange: z.string().nullable().optional(),
  exchangeShortName: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
});

const FMPQuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  changesPercentage: z.number(),
  volume: z.number().nullable(),
  previousClose: z.number().nullable(),
  timestamp: z.number().optional(),
});

const FMPKeyMetricsSchema = z.object({
  symbol: z.string().optional(),
  marketCap: z.number().nullable().optional(),
  peRatio: z.number().nullable().optional(),
  priceToSalesRatio: z.number().nullable().optional(),
  pbRatio: z.number().nullable().optional(),
  pegRatio: z.number().nullable().optional(),
  roe: z.number().nullable().optional(),
  roic: z.number().nullable().optional(),
  freeCashFlow: z.number().nullable().optional(),
  freeCashFlowPerShare: z.number().nullable().optional(),
  revenueGrowth: z.number().nullable().optional(),
  epsgrowth: z.number().nullable().optional(),
  grossProfitMargin: z.number().nullable().optional(),
  operatingProfitMargin: z.number().nullable().optional(),
  netProfitMargin: z.number().nullable().optional(),
  debtToEquity: z.number().nullable().optional(),
  currentRatio: z.number().nullable().optional(),
  beta: z.number().nullable().optional(),
  dividendYield: z.number().nullable().optional(),
});

const FMPProfileSchema = z.object({
  symbol: z.string(),
  price: z.number().nullable().optional(),
  mktCap: z.number().nullable().optional(),
  range: z.string().nullable().optional(), // "52.00-100.00"
  beta: z.number().nullable().optional(),
  sector: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
});

class FMPProvider implements IStockProvider {
  name = 'FMP';
  private apiKey: string;
  private rateLimitDelay = 300; // 300ms between requests

  constructor() {
    const key = process.env.FMP_API_KEY;
    if (!key) {
      console.warn('FMP_API_KEY not set - provider will return mock data');
    }
    this.apiKey = key || '';
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      console.warn(`FMP API key not configured - skipping ${endpoint}`);
      return null;
    }

    const url = `${FMP_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        console.error(`FMP API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('FMP API fetch error:', error);
      return null;
    }
  }

  async listTickers(): Promise<ProviderTicker[]> {
    // Get stock list from FMP
    const data = await this.fetch<unknown[]>('/stock/list');
    if (!data) return [];

    const tickers: ProviderTicker[] = [];

    for (const item of data) {
      try {
        const parsed = FMPTickerSchema.parse(item);
        // Only include US exchanges
        const exchange = parsed.exchangeShortName || parsed.exchange;
        if (exchange && ['NYSE', 'NASDAQ', 'AMEX'].includes(exchange)) {
          tickers.push({
            symbol: parsed.symbol,
            name: parsed.name,
            exchange: exchange,
            sector: parsed.sector || null,
            industry: parsed.industry || null,
          });
        }
      } catch {
        // Skip invalid entries
      }
    }

    return tickers;
  }

  async getQuote(symbol: string): Promise<ProviderQuote | null> {
    const data = await this.fetch<unknown[]>(`/quote/${symbol}`);
    if (!data || data.length === 0) return null;

    try {
      const parsed = FMPQuoteSchema.parse(data[0]);
      return {
        symbol: parsed.symbol,
        price: parsed.price,
        change: parsed.change,
        changePercent: parsed.changesPercentage,
        volume: parsed.volume || 0,
        previousClose: parsed.previousClose || parsed.price - parsed.change,
        timestamp: parsed.timestamp
          ? new Date(parsed.timestamp * 1000).toISOString()
          : new Date().toISOString(),
      };
    } catch (error) {
      console.error('Quote parse error:', error);
      return null;
    }
  }

  async getMetrics(symbol: string): Promise<ProviderMetrics | null> {
    // Fetch multiple endpoints in parallel
    const [profileData, metricsData, ratiosData] = await Promise.all([
      this.fetch<unknown[]>(`/profile/${symbol}`),
      this.fetch<unknown[]>(`/key-metrics-ttm/${symbol}`),
      this.fetch<unknown[]>(`/ratios-ttm/${symbol}`),
    ]);

    const profile = profileData?.[0];
    const metrics = metricsData?.[0];
    const ratios = ratiosData?.[0];

    if (!profile && !metrics) return null;

    try {
      const parsedProfile = profile ? FMPProfileSchema.parse(profile) : null;
      const parsedMetrics = metrics
        ? FMPKeyMetricsSchema.parse(metrics)
        : null;

      // Parse 52-week range from profile
      let week52High: number | null = null;
      let week52Low: number | null = null;
      if (parsedProfile?.range) {
        const [low, high] = parsedProfile.range.split('-').map(Number);
        week52Low = low || null;
        week52High = high || null;
      }

      const result: ProviderMetrics = {
        symbol,
        price: parsedProfile?.price || null,
        marketCap: parsedProfile?.mktCap || parsedMetrics?.marketCap || null,
        pe: parsedMetrics?.peRatio || null,
        ps: parsedMetrics?.priceToSalesRatio || null,
        pb: parsedMetrics?.pbRatio || null,
        peg: parsedMetrics?.pegRatio || null,
        roe: parsedMetrics?.roe || null,
        roic: parsedMetrics?.roic || null,
        fcf: parsedMetrics?.freeCashFlow || null,
        fcfMargin: null, // Calculate if needed
        revenueGrowthYoy: parsedMetrics?.revenueGrowth || null,
        epsGrowthYoy: parsedMetrics?.epsgrowth || null,
        grossMargin: parsedMetrics?.grossProfitMargin || null,
        operatingMargin: parsedMetrics?.operatingProfitMargin || null,
        netMargin: parsedMetrics?.netProfitMargin || null,
        debtToEquity: parsedMetrics?.debtToEquity || null,
        currentRatio: parsedMetrics?.currentRatio || null,
        beta: parsedProfile?.beta || parsedMetrics?.beta || null,
        dividendYield: parsedMetrics?.dividendYield || null,
        week52High,
        week52Low,
      };

      return result;
    } catch (error) {
      console.error('Metrics parse error:', error);
      return null;
    }
  }

  async getFundamentalsAnnual(symbol: string): Promise<ProviderFundamentals[]> {
    const data = await this.fetch<unknown[]>(
      `/income-statement/${symbol}?limit=5`
    );
    if (!data) return [];

    // TODO: Implement full fundamentals parsing
    return [];
  }
}

export const fmpProvider = new FMPProvider();
