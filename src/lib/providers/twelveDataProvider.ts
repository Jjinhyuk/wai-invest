/**
 * Twelve Data API Provider
 * 무료 티어: 일 800콜, 분당 8콜
 * https://twelvedata.com/docs
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

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// Rate limiter - 분당 8콜 제한
class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number = 8, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.calls.push(Date.now());
  }
}

class TwelveDataProvider implements IMarketDataProvider {
  name = 'TwelveData';
  private apiKey: string;
  private rateLimiter = new RateLimiter(7, 60000); // 여유있게 분당 7콜

  constructor() {
    const key = process.env.TWELVE_DATA_API_KEY;
    if (!key) {
      console.warn('TWELVE_DATA_API_KEY not set');
    }
    this.apiKey = key || '';
  }

  private async fetch<T>(endpoint: string): Promise<T | null> {
    if (!this.apiKey) {
      console.warn('Twelve Data API key not configured');
      return null;
    }

    await this.rateLimiter.waitForSlot();

    const url = `${TWELVE_DATA_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        console.error(`Twelve Data API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // API 에러 응답 체크
      if (data && typeof data === 'object' && 'code' in data && data.code >= 400) {
        console.error(`Twelve Data API error: ${data.message}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Twelve Data fetch error:', error);
      return null;
    }
  }

  async getIndices(): Promise<MarketIndex[]> {
    // 캐시 확인
    const cached = cache.get<MarketIndex[]>(CacheKeys.marketIndices());
    if (cached) return cached;

    // ETF를 통해 지수 조회 (한 번의 API 호출로 모든 ETF 조회)
    const data = await this.fetch<Record<string, TwelveDataQuote>>(
      '/quote?symbol=SPY,QQQ,DIA,IWM'
    );

    if (!data) return [];

    // 실시간 배수 계산을 위한 기준 지수 (매일 업데이트 필요)
    // 이 값들은 실제 지수와 ETF의 관계를 나타냄
    const indexConfig = [
      {
        etf: 'SPY',
        name: 'S&P 500',
        displaySymbol: 'SPX',
        // 실제 S&P 500 지수 / SPY 가격 비율 (대략 10:1)
        getMultiplier: (price: number) => 6827.41 / 681.76, // 기준일 기준
      },
      {
        etf: 'QQQ',
        name: 'NASDAQ',
        displaySymbol: 'IXIC',
        getMultiplier: (price: number) => 23195.17 / 613.62,
      },
      {
        etf: 'DIA',
        name: 'DOW 30',
        displaySymbol: 'DJI',
        getMultiplier: (price: number) => 43856 / 485.40,
      },
      {
        etf: 'IWM',
        name: 'Russell 2000',
        displaySymbol: 'RUT',
        getMultiplier: (price: number) => 2361 / 253.85,
      },
    ];

    const indices: MarketIndex[] = [];

    for (const config of indexConfig) {
      const quote = data[config.etf];
      if (quote && quote.close) {
        const price = parseFloat(quote.close);
        const prevClose = parseFloat(quote.previous_close || quote.close);
        const multiplier = config.getMultiplier(price);

        // ETF 가격 변동률로 지수 변동 계산
        const percentChange = parseFloat(quote.percent_change || '0');
        const indexPrice = Math.round(price * multiplier * 100) / 100;
        const indexPrevClose = Math.round(prevClose * multiplier * 100) / 100;
        const indexChange = Math.round((indexPrice - indexPrevClose) * 100) / 100;

        indices.push({
          symbol: config.displaySymbol,
          name: config.name,
          price: indexPrice,
          change: indexChange,
          changePercent: percentChange,
          previousClose: indexPrevClose,
          timestamp: quote.datetime || new Date().toISOString(),
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

    // VIX와 다른 지표들 조회
    const data = await this.fetch<Record<string, TwelveDataQuote>>(
      '/quote?symbol=UVXY,UUP,TLT'
    );

    const indicators: MarketIndicator[] = [];

    if (data) {
      // VIX 근사 (UVXY ETF 기반)
      if (data.UVXY?.close) {
        const uvxyPrice = parseFloat(data.UVXY.close);
        const vixApprox = Math.round(uvxyPrice * 0.8 * 100) / 100; // 대략적인 VIX 근사
        indicators.push({
          symbol: 'VIX',
          name: '공포지수',
          value: vixApprox,
          change: parseFloat(data.UVXY.change || '0') * 0.8,
          status: vixApprox < 20 ? 'low' : vixApprox > 30 ? 'high' : 'normal',
        });
      }

      // 달러 인덱스 근사 (UUP ETF 기반)
      if (data.UUP?.close) {
        const uupPrice = parseFloat(data.UUP.close);
        const dxyApprox = Math.round((uupPrice - 25) * 4 + 100);
        indicators.push({
          symbol: 'DXY',
          name: '달러 인덱스',
          value: dxyApprox,
          change: parseFloat(data.UUP.change || '0') * 4,
        });
      }

      // 10년물 금리 근사 (TLT 역산)
      if (data.TLT?.close) {
        const tltPrice = parseFloat(data.TLT.close);
        const yieldApprox = Math.round((4.0 + (100 - tltPrice) * 0.05) * 100) / 100;
        indicators.push({
          symbol: 'TNX',
          name: '미국 10년물',
          value: yieldApprox,
          unit: '%',
        });
      }
    }

    // 원/달러 (기본값)
    indicators.push({
      symbol: 'USDKRW',
      name: '원/달러',
      value: 1435,
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

    // 원자재 ETF 조회
    const data = await this.fetch<Record<string, TwelveDataQuote>>(
      '/quote?symbol=GLD,USO'
    );

    const commodities: CommodityData[] = [];

    if (data) {
      // 금 (GLD ETF 기반)
      if (data.GLD?.close) {
        const gldPrice = parseFloat(data.GLD.close);
        commodities.push({
          symbol: 'GC',
          name: '금',
          price: Math.round(gldPrice * 10), // GLD는 금 가격의 약 1/10
          change: parseFloat(data.GLD.change || '0') * 10,
          changePercent: parseFloat(data.GLD.percent_change || '0'),
          currency: 'USD',
        });
      }

      // 원유 (USO ETF 기반)
      if (data.USO?.close) {
        commodities.push({
          symbol: 'CL',
          name: '원유(WTI)',
          price: parseFloat(data.USO.close),
          change: parseFloat(data.USO.change || '0'),
          changePercent: parseFloat(data.USO.percent_change || '0'),
          currency: 'USD',
        });
      }
    }

    // 비트코인 (별도 조회)
    const btcData = await this.fetch<TwelveDataQuote>('/quote?symbol=BTC/USD');
    if (btcData?.close) {
      commodities.push({
        symbol: 'BTC',
        name: '비트코인',
        price: Math.round(parseFloat(btcData.close)),
        change: Math.round(parseFloat(btcData.change || '0')),
        changePercent: parseFloat(btcData.percent_change || '0'),
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

    const quote = await this.fetch<TwelveDataQuote>(`/quote?symbol=${symbol}`);
    if (!quote || !quote.close) return null;

    const result: StockQuote = {
      symbol,
      price: parseFloat(quote.close),
      change: parseFloat(quote.change || '0'),
      changePercent: parseFloat(quote.percent_change || '0'),
      open: parseFloat(quote.open || '0'),
      high: parseFloat(quote.high || '0'),
      low: parseFloat(quote.low || '0'),
      previousClose: parseFloat(quote.previous_close || '0'),
      volume: parseInt(quote.volume || '0'),
      timestamp: quote.datetime || new Date().toISOString(),
    };

    cache.set(cacheKey, result, CacheTTL.stockQuote);
    return result;
  }

  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    // 한 번에 여러 심볼 조회
    const symbolStr = symbols.join(',');
    const data = await this.fetch<Record<string, TwelveDataQuote>>(
      `/quote?symbol=${symbolStr}`
    );

    if (!data) return [];

    const quotes: StockQuote[] = [];
    for (const symbol of symbols) {
      const quote = data[symbol];
      if (quote?.close) {
        quotes.push({
          symbol,
          price: parseFloat(quote.close),
          change: parseFloat(quote.change || '0'),
          changePercent: parseFloat(quote.percent_change || '0'),
          open: parseFloat(quote.open || '0'),
          high: parseFloat(quote.high || '0'),
          low: parseFloat(quote.low || '0'),
          previousClose: parseFloat(quote.previous_close || '0'),
          volume: parseInt(quote.volume || '0'),
          timestamp: quote.datetime || new Date().toISOString(),
        });
      }
    }

    return quotes;
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    // Twelve Data에서 프로필은 별도 엔드포인트
    return null; // 일단 미구현
  }
}

// Twelve Data API 응답 타입
interface TwelveDataQuote {
  symbol?: string;
  name?: string;
  exchange?: string;
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  is_market_open?: boolean;
}

export const twelveDataProvider = new TwelveDataProvider();
