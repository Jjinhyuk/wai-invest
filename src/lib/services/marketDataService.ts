/**
 * 시장 데이터 서비스
 * 여러 provider를 통합하고, 캐싱 및 fallback 로직을 처리합니다.
 */

import { finnhubProvider } from '../providers/finnhubProvider';
import {
  IMarketDataProvider,
  MarketIndex,
  MarketIndicator,
  CommodityData,
  FearGreedData,
  MarketDataResponse,
  StockQuote,
  CompanyProfile,
} from '../providers/marketDataTypes';
import { cache, CacheKeys, CacheTTL } from '../cache';

class MarketDataService {
  private providers: IMarketDataProvider[] = [];
  private primaryProvider: IMarketDataProvider | null = null;

  constructor() {
    // Provider 등록 (우선순위 순)
    this.providers = [finnhubProvider];
    this.primaryProvider = finnhubProvider;
  }

  /**
   * 현재 활성 provider 이름
   */
  getProviderName(): string {
    return this.primaryProvider?.name || 'None';
  }

  /**
   * 전체 시장 데이터 가져오기
   */
  async getMarketData(): Promise<MarketDataResponse> {
    const [indices, indicators, commodities] = await Promise.all([
      this.getIndices(),
      this.getIndicators(),
      this.getCommodities(),
    ]);

    // Fear & Greed 계산 (VIX 기반)
    const fearGreed = this.calculateFearGreed(indicators);

    return {
      indices,
      indicators,
      commodities,
      fearGreed,
      lastUpdate: new Date().toISOString(),
      source: this.getProviderName(),
    };
  }

  /**
   * 주요 지수 가져오기
   */
  async getIndices(): Promise<MarketIndex[]> {
    if (!this.primaryProvider) {
      return this.getDefaultIndices();
    }

    try {
      const indices = await this.primaryProvider.getIndices();
      return indices.length > 0 ? indices : this.getDefaultIndices();
    } catch (error) {
      console.error('Failed to fetch indices:', error);
      return this.getDefaultIndices();
    }
  }

  /**
   * 시장 지표 가져오기
   */
  async getIndicators(): Promise<MarketIndicator[]> {
    if (!this.primaryProvider) {
      return this.getDefaultIndicators();
    }

    try {
      const indicators = await this.primaryProvider.getIndicators();
      return indicators.length > 0 ? indicators : this.getDefaultIndicators();
    } catch (error) {
      console.error('Failed to fetch indicators:', error);
      return this.getDefaultIndicators();
    }
  }

  /**
   * 원자재/암호화폐 가져오기
   */
  async getCommodities(): Promise<CommodityData[]> {
    if (!this.primaryProvider) {
      return this.getDefaultCommodities();
    }

    try {
      const commodities = await this.primaryProvider.getCommodities();
      return commodities.length > 0 ? commodities : this.getDefaultCommodities();
    } catch (error) {
      console.error('Failed to fetch commodities:', error);
      return this.getDefaultCommodities();
    }
  }

  /**
   * 주식 시세 가져오기
   */
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    if (!this.primaryProvider) return null;

    try {
      return await this.primaryProvider.getStockQuote(symbol);
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * 여러 주식 시세 가져오기
   */
  async getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (!this.primaryProvider) return [];

    try {
      return await this.primaryProvider.getStockQuotes(symbols);
    } catch (error) {
      console.error('Failed to fetch stock quotes:', error);
      return [];
    }
  }

  /**
   * 회사 프로필 가져오기
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    if (!this.primaryProvider) return null;

    try {
      return await this.primaryProvider.getCompanyProfile(symbol);
    } catch (error) {
      console.error(`Failed to fetch profile for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fear & Greed 지수 계산 (VIX 기반)
   */
  private calculateFearGreed(indicators: MarketIndicator[]): FearGreedData {
    const vix = indicators.find(i => i.symbol === 'VIX')?.value || 20;

    // VIX 기반 Fear & Greed 계산
    // VIX 10 이하 = 극단적 탐욕 (90-100)
    // VIX 15 = 탐욕 (70-90)
    // VIX 20 = 중립 (40-60)
    // VIX 25 = 두려움 (20-40)
    // VIX 30+ = 극단적 두려움 (0-20)
    let value: number;
    if (vix <= 12) {
      value = 90 + (12 - vix) * 5;
    } else if (vix <= 18) {
      value = 60 + (18 - vix) * 5;
    } else if (vix <= 25) {
      value = 30 + (25 - vix) * 4;
    } else if (vix <= 35) {
      value = 10 + (35 - vix) * 2;
    } else {
      value = Math.max(0, 10 - (vix - 35));
    }

    value = Math.max(0, Math.min(100, Math.round(value)));

    let label: string;
    if (value >= 75) label = '극단적 탐욕';
    else if (value >= 55) label = '탐욕';
    else if (value >= 45) label = '중립';
    else if (value >= 25) label = '두려움';
    else label = '극단적 두려움';

    return { value, label };
  }

  // 기본값 (API 없을 때 - 최근 실제 데이터 기반)
  // 2024년 12월 기준 대략적인 값으로 설정
  private getDefaultIndices(): MarketIndex[] {
    return [
      { symbol: 'SPY', name: 'S&P 500', price: 607.51, change: 0, changePercent: 0 },
      { symbol: 'QQQ', name: 'NASDAQ 100', price: 531.74, change: 0, changePercent: 0 },
      { symbol: 'DIA', name: 'DOW 30', price: 438.56, change: 0, changePercent: 0 },
      { symbol: 'IWM', name: 'Russell 2000', price: 236.12, change: 0, changePercent: 0 },
    ];
  }

  private getDefaultIndicators(): MarketIndicator[] {
    return [
      { symbol: 'VIX', name: '공포지수', value: 14.5, status: 'low' },
      { symbol: 'DXY', name: '달러 인덱스', value: 106.8, change: 0 },
      { symbol: 'TNX', name: '미국 10년물', value: 4.35, unit: '%' },
      { symbol: 'USDKRW', name: '원/달러', value: 1435, change: 0 },
    ];
  }

  private getDefaultCommodities(): CommodityData[] {
    return [
      { symbol: 'GC', name: '금', price: 2650, change: 0, changePercent: 0 },
      { symbol: 'CL', name: '원유(WTI)', price: 70.5, change: 0, changePercent: 0 },
      { symbol: 'BTC', name: '비트코인', price: 101500, change: 0, changePercent: 0 },
    ];
  }
}

// 싱글톤 인스턴스
export const marketDataService = new MarketDataService();
