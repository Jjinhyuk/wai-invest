/**
 * 시장 데이터 Provider 타입 정의
 * 여러 API provider를 추상화하여 쉽게 교체할 수 있게 합니다.
 */

// 주요 지수 데이터
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  timestamp?: string;
}

// 시장 지표 데이터
export interface MarketIndicator {
  symbol: string;
  name: string;
  value: number;
  change?: number;
  changePercent?: number;
  unit?: string;
  status?: 'low' | 'normal' | 'high';
}

// 원자재/암호화폐 데이터
export interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

// Fear & Greed 지수
export interface FearGreedData {
  value: number;
  label: string;
  previousValue?: number;
  previousLabel?: string;
}

// 주식 시세 데이터
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  timestamp: string;
}

// 회사 프로필
export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  marketCap: number;
  employees?: number;
  description?: string;
  website?: string;
  logo?: string;
  country?: string;
  ipo?: string;
}

// 전체 시장 데이터 응답
export interface MarketDataResponse {
  indices: MarketIndex[];
  indicators: MarketIndicator[];
  commodities: CommodityData[];
  fearGreed: FearGreedData;
  lastUpdate: string;
  source: string;
}

// 시장 데이터 Provider 인터페이스
export interface IMarketDataProvider {
  name: string;

  // 주요 지수 가져오기
  getIndices(): Promise<MarketIndex[]>;

  // 시장 지표 가져오기 (VIX, DXY 등)
  getIndicators(): Promise<MarketIndicator[]>;

  // 원자재/암호화폐 가져오기
  getCommodities(): Promise<CommodityData[]>;

  // 개별 주식 시세
  getStockQuote(symbol: string): Promise<StockQuote | null>;

  // 여러 주식 시세 (배치)
  getStockQuotes(symbols: string[]): Promise<StockQuote[]>;

  // 회사 프로필
  getCompanyProfile(symbol: string): Promise<CompanyProfile | null>;
}

// Provider 상태
export interface ProviderStatus {
  name: string;
  isAvailable: boolean;
  remainingCalls?: number;
  resetTime?: string;
  lastError?: string;
}
