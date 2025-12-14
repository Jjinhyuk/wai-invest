/**
 * Finnhub API Provider
 * 무료 티어: 초당 30콜, 무제한
 * https://finnhub.io/docs/api
 */

import {
  IMarketDataProvider,
  MarketIndex,
  MarketIndicator,
  CommodityData,
  StockQuote,
  CompanyProfile,
} from './marketDataTypes';
import { cache, CacheKeys, CacheTTL } from '../cache';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Rate limiter - 초당 30콜 제한
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 30, windowMs: number = 1000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.calls.push(Date.now());
  }
}

class FinnhubProvider implements IMarketDataProvider {
  name = 'Finnhub';
  private apiKey: string;
  private rateLimiter = new RateLimiter(25, 1000); // 여유있게 초당 25콜

  constructor() {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) {
      console.warn('FINNHUB_API_KEY not set');
    }
    this.apiKey = key || '';
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      console.warn('Finnhub API key not configured');
      return null;
    }

    await this.rateLimiter.waitForSlot();

    const url = `${FINNHUB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        console.error(`Finnhub API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // API 에러 응답 체크 (Invalid API key 등)
      if (data && typeof data === 'object' && 'error' in data) {
        console.error(`Finnhub API error: ${data.error}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Finnhub fetch error:', error);
      return null;
    }
  }

  async getIndices(): Promise<MarketIndex[]> {
    // 캐시 확인
    const cached = cache.get<MarketIndex[]>(CacheKeys.marketIndices());
    if (cached) return cached;

    // ETF를 통해 주요 지수 조회
    const indexSymbols = [
      { symbol: 'SPY', name: 'S&P 500' },
      { symbol: 'QQQ', name: 'NASDAQ 100' },
      { symbol: 'DIA', name: 'DOW 30' },
      { symbol: 'IWM', name: 'Russell 2000' },
    ];

    const indices: MarketIndex[] = [];

    for (const idx of indexSymbols) {
      const quote = await this.fetch<FinnhubQuote>(`/quote?symbol=${idx.symbol}`);
      if (quote && quote.c) {
        indices.push({
          symbol: idx.symbol,
          name: idx.name,
          price: quote.c,
          change: quote.d || 0,
          changePercent: quote.dp || 0,
          previousClose: quote.pc,
          open: quote.o,
          high: quote.h,
          low: quote.l,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (indices.length > 0) {
      cache.set(CacheKeys.marketIndices(), indices, CacheTTL.marketData);
    }

    return indices;
  }

  async getIndicators(): Promise<MarketIndicator[]> {
    const cached = cache.get<MarketIndicator[]>(CacheKeys.marketIndicators());
    if (cached) return cached;

    const indicators: MarketIndicator[] = [];

    // VIX (CBOE Volatility Index) - UVXY ETF로 대체
    const vixQuote = await this.fetch<FinnhubQuote>('/quote?symbol=UVXY');
    if (vixQuote && vixQuote.c) {
      // UVXY는 VIX의 1.5배 레버리지이므로 조정
      const vixApprox = vixQuote.c / 1.5;
      indicators.push({
        symbol: 'VIX',
        name: '공포지수',
        value: Math.round(vixApprox * 100) / 100,
        change: vixQuote.d ? vixQuote.d / 1.5 : 0,
        status: vixApprox < 20 ? 'low' : vixApprox > 30 ? 'high' : 'normal',
      });
    }

    // USD Index (DXY) - UUP ETF로 대체
    const dxyQuote = await this.fetch<FinnhubQuote>('/quote?symbol=UUP');
    if (dxyQuote && dxyQuote.c) {
      // UUP를 DXY 근사치로 변환 (대략적인 스케일링)
      const dxyApprox = (dxyQuote.c - 25) * 4 + 100;
      indicators.push({
        symbol: 'DXY',
        name: '달러 인덱스',
        value: Math.round(dxyApprox * 100) / 100,
        change: dxyQuote.d ? dxyQuote.d * 4 : 0,
      });
    }

    // 10-Year Treasury - TLT ETF로 간접 추정
    const tltQuote = await this.fetch<FinnhubQuote>('/quote?symbol=TLT');
    if (tltQuote && tltQuote.c) {
      // TLT 가격과 금리는 역의 관계
      // 대략적인 추정 (실제로는 더 복잡)
      const yieldApprox = 4.0 + (100 - tltQuote.c) * 0.05;
      indicators.push({
        symbol: 'TNX',
        name: '미국 10년물',
        value: Math.round(yieldApprox * 100) / 100,
        unit: '%',
      });
    }

    // USD/KRW는 Finnhub 무료에서 제한적 - 기본값 사용
    indicators.push({
      symbol: 'USDKRW',
      name: '원/달러',
      value: 1380,
      change: 0,
    });

    if (indicators.length > 0) {
      cache.set(CacheKeys.marketIndicators(), indicators, CacheTTL.marketData);
    }

    return indicators;
  }

  async getCommodities(): Promise<CommodityData[]> {
    const cached = cache.get<CommodityData[]>(CacheKeys.marketCommodities());
    if (cached) return cached;

    const commodities: CommodityData[] = [];

    // Gold - GLD ETF
    const goldQuote = await this.fetch<FinnhubQuote>('/quote?symbol=GLD');
    if (goldQuote && goldQuote.c) {
      // GLD는 금 가격의 약 1/10
      commodities.push({
        symbol: 'GC',
        name: '금',
        price: Math.round(goldQuote.c * 10),
        change: (goldQuote.d || 0) * 10,
        changePercent: goldQuote.dp || 0,
        currency: 'USD',
      });
    }

    // Oil - USO ETF
    const oilQuote = await this.fetch<FinnhubQuote>('/quote?symbol=USO');
    if (oilQuote && oilQuote.c) {
      // USO는 원유 가격과 직접 연동되지 않지만 방향성은 유사
      commodities.push({
        symbol: 'CL',
        name: '원유(WTI)',
        price: Math.round(oilQuote.c * 100) / 100,
        change: oilQuote.d || 0,
        changePercent: oilQuote.dp || 0,
        currency: 'USD',
      });
    }

    // Bitcoin - Finnhub crypto endpoint (무료)
    const btcData = await this.fetch<FinnhubCryptoCandle>(
      '/crypto/candle?symbol=BINANCE:BTCUSDT&resolution=D&count=1'
    );
    if (btcData && btcData.c && btcData.c.length > 0) {
      const currentPrice = btcData.c[btcData.c.length - 1];
      const openPrice = btcData.o ? btcData.o[btcData.o.length - 1] : currentPrice;
      commodities.push({
        symbol: 'BTC',
        name: '비트코인',
        price: Math.round(currentPrice),
        change: Math.round(currentPrice - openPrice),
        changePercent: Math.round(((currentPrice - openPrice) / openPrice) * 10000) / 100,
        currency: 'USD',
      });
    }

    if (commodities.length > 0) {
      cache.set(CacheKeys.marketCommodities(), commodities, CacheTTL.marketData);
    }

    return commodities;
  }

  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = CacheKeys.stockQuote(symbol);
    const cached = cache.get<StockQuote>(cacheKey);
    if (cached) return cached;

    const quote = await this.fetch<FinnhubQuote>(`/quote?symbol=${symbol}`);
    if (!quote || !quote.c) return null;

    const result: StockQuote = {
      symbol,
      price: quote.c,
      change: quote.d || 0,
      changePercent: quote.dp || 0,
      open: quote.o || 0,
      high: quote.h || 0,
      low: quote.l || 0,
      previousClose: quote.pc || 0,
      volume: 0, // Finnhub quote에는 volume이 없음
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, result, CacheTTL.stockQuote);
    return result;
  }

  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    const quotes: StockQuote[] = [];

    // 병렬 처리하되 rate limit 고려
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchQuotes = await Promise.all(
        batch.map(symbol => this.getStockQuote(symbol))
      );
      quotes.push(...batchQuotes.filter((q): q is StockQuote => q !== null));

      // 배치 간 짧은 딜레이
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return quotes;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    const cacheKey = CacheKeys.stockProfile(symbol);
    const cached = cache.get<CompanyProfile>(cacheKey);
    if (cached) return cached;

    const profile = await this.fetch<FinnhubProfile>(`/stock/profile2?symbol=${symbol}`);
    if (!profile || !profile.name) return null;

    const result: CompanyProfile = {
      symbol: profile.ticker || symbol,
      name: profile.name,
      exchange: profile.exchange || '',
      sector: profile.finnhubIndustry || '',
      industry: profile.finnhubIndustry || '',
      marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1000000 : 0,
      employees: profile.employeeTotal,
      website: profile.weburl,
      logo: profile.logo,
      country: profile.country,
      ipo: profile.ipo,
    };

    cache.set(cacheKey, result, CacheTTL.stockProfile);
    return result;
  }
}

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
  ticker?: string;
  name: string;
  exchange?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  employeeTotal?: number;
  weburl?: string;
  logo?: string;
  country?: string;
  ipo?: string;
}

interface FinnhubCryptoCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  t: number[]; // Timestamps
  v: number[]; // Volumes
  s: string;   // Status
}

export const finnhubProvider = new FinnhubProvider();
