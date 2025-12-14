/**
 * Free Stock Provider
 * Finnhub API를 사용하여 무료로 종목 데이터 제공
 * S&P 500 대표 종목 기반
 */

import {
  IStockProvider,
  ProviderTicker,
  ProviderQuote,
  ProviderMetrics,
} from './types';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// S&P 500 대표 종목 (시가총액 상위 100개)
const SP500_TOP_STOCKS: ProviderTicker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'E-Commerce' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Social Media' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Insurance' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Credit Services' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', sector: 'Healthcare', industry: 'Healthcare Plans' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Retail' },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Credit Services' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Household Products' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', industry: 'Home Improvement' },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy', industry: 'Oil & Gas' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { symbol: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Beverages' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', sector: 'Consumer Defensive', industry: 'Beverages' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', exchange: 'NASDAQ', sector: 'Consumer Defensive', industry: 'Retail' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', exchange: 'NYSE', sector: 'Healthcare', industry: 'Diagnostics' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Networking' },
  { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology', industry: 'Software' },
  { symbol: 'ACN', name: 'Accenture plc', exchange: 'NYSE', sector: 'Technology', industry: 'IT Services' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Entertainment' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology', industry: 'Software' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services', industry: 'Entertainment' },
  { symbol: 'ABT', name: 'Abbott Laboratories', exchange: 'NYSE', sector: 'Healthcare', industry: 'Medical Devices' },
  { symbol: 'VZ', name: 'Verizon Communications', exchange: 'NYSE', sector: 'Communication Services', industry: 'Telecom' },
  { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', industry: 'Footwear' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'DHR', name: 'Danaher Corporation', exchange: 'NYSE', sector: 'Healthcare', industry: 'Diagnostics' },
  { symbol: 'PM', name: 'Philip Morris International', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Tobacco' },
  { symbol: 'T', name: 'AT&T Inc.', exchange: 'NYSE', sector: 'Communication Services', industry: 'Telecom' },
  { symbol: 'NEE', name: 'NextEra Energy Inc.', exchange: 'NYSE', sector: 'Utilities', industry: 'Utilities' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Media' },
  { symbol: 'UPS', name: 'United Parcel Service', exchange: 'NYSE', sector: 'Industrials', industry: 'Logistics' },
  { symbol: 'IBM', name: 'International Business Machines', exchange: 'NYSE', sector: 'Technology', industry: 'IT Services' },
  { symbol: 'SPGI', name: 'S&P Global Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Financial Data' },
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', sector: 'Industrials', industry: 'Aerospace' },
  { symbol: 'GE', name: 'General Electric Company', exchange: 'NYSE', sector: 'Industrials', industry: 'Conglomerate' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE', sector: 'Industrials', industry: 'Machinery' },
  { symbol: 'HON', name: 'Honeywell International', exchange: 'NASDAQ', sector: 'Industrials', industry: 'Conglomerate' },
  { symbol: 'AMGN', name: 'Amgen Inc.', exchange: 'NASDAQ', sector: 'Healthcare', industry: 'Biotechnology' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', industry: 'Home Improvement' },
  { symbol: 'RTX', name: 'RTX Corporation', exchange: 'NYSE', sector: 'Industrials', industry: 'Aerospace' },
  { symbol: 'GS', name: 'Goldman Sachs Group', exchange: 'NYSE', sector: 'Financial Services', industry: 'Investment Banking' },
  { symbol: 'BLK', name: 'BlackRock Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Asset Management' },
  { symbol: 'MS', name: 'Morgan Stanley', exchange: 'NYSE', sector: 'Financial Services', industry: 'Investment Banking' },
  { symbol: 'ISRG', name: 'Intuitive Surgical Inc.', exchange: 'NASDAQ', sector: 'Healthcare', industry: 'Medical Devices' },
  { symbol: 'MDT', name: 'Medtronic plc', exchange: 'NYSE', sector: 'Healthcare', industry: 'Medical Devices' },
  { symbol: 'AXP', name: 'American Express Company', exchange: 'NYSE', sector: 'Financial Services', industry: 'Credit Services' },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Travel' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.', exchange: 'NASDAQ', sector: 'Healthcare', industry: 'Biotechnology' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', exchange: 'NYSE', sector: 'Technology', industry: 'Software' },
  { symbol: 'INTU', name: 'Intuit Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
  { symbol: 'MO', name: 'Altria Group Inc.', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Tobacco' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'Restaurants' },
  { symbol: 'C', name: 'Citigroup Inc.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Banks' },
  { symbol: 'MMM', name: '3M Company', exchange: 'NYSE', sector: 'Industrials', industry: 'Conglomerate' },
  { symbol: 'ADP', name: 'Automatic Data Processing', exchange: 'NASDAQ', sector: 'Technology', industry: 'IT Services' },
  { symbol: 'DE', name: 'Deere & Company', exchange: 'NYSE', sector: 'Industrials', industry: 'Farm Machinery' },
  { symbol: 'TJX', name: 'TJX Companies Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', industry: 'Retail' },
  { symbol: 'SCHW', name: 'Charles Schwab Corp.', exchange: 'NYSE', sector: 'Financial Services', industry: 'Brokerage' },
  { symbol: 'CVS', name: 'CVS Health Corporation', exchange: 'NYSE', sector: 'Healthcare', industry: 'Pharmacy' },
  { symbol: 'MDLZ', name: 'Mondelez International', exchange: 'NASDAQ', sector: 'Consumer Defensive', industry: 'Food' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', exchange: 'NYSE', sector: 'Healthcare', industry: 'Drug Manufacturers' },
  { symbol: 'SO', name: 'Southern Company', exchange: 'NYSE', sector: 'Utilities', industry: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy Corporation', exchange: 'NYSE', sector: 'Utilities', industry: 'Utilities' },
  { symbol: 'CL', name: 'Colgate-Palmolive Co.', exchange: 'NYSE', sector: 'Consumer Defensive', industry: 'Household Products' },
  { symbol: 'ZTS', name: 'Zoetis Inc.', exchange: 'NYSE', sector: 'Healthcare', industry: 'Veterinary' },
  { symbol: 'PLD', name: 'Prologis Inc.', exchange: 'NYSE', sector: 'Real Estate', industry: 'REIT' },
  { symbol: 'MU', name: 'Micron Technology Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'REGN', name: 'Regeneron Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', industry: 'Biotechnology' },
  { symbol: 'SYK', name: 'Stryker Corporation', exchange: 'NYSE', sector: 'Healthcare', industry: 'Medical Devices' },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals', exchange: 'NASDAQ', sector: 'Healthcare', industry: 'Biotechnology' },
  { symbol: 'CI', name: 'Cigna Corporation', exchange: 'NYSE', sector: 'Healthcare', industry: 'Healthcare Plans' },
  { symbol: 'CB', name: 'Chubb Limited', exchange: 'NYSE', sector: 'Financial Services', industry: 'Insurance' },
  { symbol: 'CME', name: 'CME Group Inc.', exchange: 'NASDAQ', sector: 'Financial Services', industry: 'Exchanges' },
  { symbol: 'FDX', name: 'FedEx Corporation', exchange: 'NYSE', sector: 'Industrials', industry: 'Logistics' },
  { symbol: 'ATVI', name: 'Activision Blizzard', exchange: 'NASDAQ', sector: 'Technology', industry: 'Gaming' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ', sector: 'Financial Services', industry: 'Fintech' },
  { symbol: 'AMAT', name: 'Applied Materials Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'LRCX', name: 'Lam Research Corp.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'ADI', name: 'Analog Devices Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
  { symbol: 'PANW', name: 'Palo Alto Networks', exchange: 'NASDAQ', sector: 'Technology', industry: 'Cybersecurity' },
  { symbol: 'SNPS', name: 'Synopsys Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
  { symbol: 'KLAC', name: 'KLA Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
];

// Finnhub API 응답 타입
interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High
  l: number;  // Low
  o: number;  // Open
  pc: number; // Previous close
  t: number;  // Timestamp
}

interface FinnhubProfile {
  name: string;
  ticker: string;
  finnhubIndustry: string;
  marketCapitalization: number;
  shareOutstanding: number;
}

interface FinnhubMetric {
  metric: {
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    'peBasicExclExtraTTM'?: number;
    'psTTM'?: number;
    'pbQuarterly'?: number;
    'roeTTM'?: number;
    'roicTTM'?: number;
    'revenueGrowthTTMYoy'?: number;
    'epsGrowthTTMYoy'?: number;
    'grossMarginTTM'?: number;
    'operatingMarginTTM'?: number;
    'netProfitMarginTTM'?: number;
    'currentRatioQuarterly'?: number;
    'totalDebtToEquityQuarterly'?: number;
    'beta'?: number;
    'dividendYieldIndicatedAnnual'?: number;
    'freeCashFlowTTM'?: number;
  };
}

class FreeStockProvider implements IStockProvider {
  name = 'Finnhub';
  private apiKey: string;
  private rateLimitDelay = 100; // 100ms between requests

  constructor() {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) {
      console.warn('FINNHUB_API_KEY not set');
    }
    this.apiKey = key || '';
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      return null;
    }

    const url = `${FINNHUB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${this.apiKey}`;

    try {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 }, // 5분 캐시
      });

      if (!response.ok) {
        console.error(`Finnhub API error: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Finnhub fetch error:', error);
      return null;
    }
  }

  async listTickers(): Promise<ProviderTicker[]> {
    // 무료 티어에서는 S&P 500 대표 종목 반환
    return SP500_TOP_STOCKS;
  }

  async getQuote(symbol: string): Promise<ProviderQuote | null> {
    const data = await this.fetch<FinnhubQuote>(`/quote?symbol=${symbol}`);
    if (!data || !data.c) return null;

    return {
      symbol,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
      volume: 0,
      previousClose: data.pc || data.c,
      timestamp: new Date().toISOString(),
    };
  }

  async getMetrics(symbol: string): Promise<ProviderMetrics | null> {
    // Finnhub의 기본 메트릭 가져오기
    const [quote, profile, metrics] = await Promise.all([
      this.fetch<FinnhubQuote>(`/quote?symbol=${symbol}`),
      this.fetch<FinnhubProfile>(`/stock/profile2?symbol=${symbol}`),
      this.fetch<FinnhubMetric>(`/stock/metric?symbol=${symbol}&metric=all`),
    ]);

    if (!quote?.c) return null;

    const m = metrics?.metric || {};

    return {
      symbol,
      price: quote.c,
      marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1000000 : null,
      pe: m['peBasicExclExtraTTM'] || null,
      ps: m['psTTM'] || null,
      pb: m['pbQuarterly'] || null,
      peg: null, // Finnhub 무료에서 PEG 없음
      roe: m['roeTTM'] ? m['roeTTM'] / 100 : null,
      roic: m['roicTTM'] ? m['roicTTM'] / 100 : null,
      fcf: m['freeCashFlowTTM'] || null,
      fcfMargin: null,
      revenueGrowthYoy: m['revenueGrowthTTMYoy'] ? m['revenueGrowthTTMYoy'] / 100 : null,
      epsGrowthYoy: m['epsGrowthTTMYoy'] ? m['epsGrowthTTMYoy'] / 100 : null,
      grossMargin: m['grossMarginTTM'] ? m['grossMarginTTM'] / 100 : null,
      operatingMargin: m['operatingMarginTTM'] ? m['operatingMarginTTM'] / 100 : null,
      netMargin: m['netProfitMarginTTM'] ? m['netProfitMarginTTM'] / 100 : null,
      debtToEquity: m['totalDebtToEquityQuarterly'] || null,
      currentRatio: m['currentRatioQuarterly'] || null,
      beta: m['beta'] || null,
      dividendYield: m['dividendYieldIndicatedAnnual'] ? m['dividendYieldIndicatedAnnual'] / 100 : null,
      week52High: m['52WeekHigh'] || null,
      week52Low: m['52WeekLow'] || null,
    };
  }
}

export const freeStockProvider = new FreeStockProvider();
