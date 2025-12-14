/**
 * Stock Scoring Module
 * 기존 API와의 호환성을 위한 래퍼
 */

import { calculateScores } from './utils/scoreCalculator';
import { ProviderMetrics } from './providers/types';

interface MetricsInput {
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
}

interface ScoreOutput {
  quality: number;
  growth: number;
  value: number;
  risk: number;
  total: number;
  explain: string;
}

/**
 * DB 형식의 메트릭을 Provider 형식으로 변환
 */
function convertToProviderMetrics(metrics: MetricsInput): ProviderMetrics {
  return {
    symbol: metrics.symbol,
    price: metrics.price,
    marketCap: metrics.market_cap,
    pe: metrics.pe,
    ps: metrics.ps,
    pb: metrics.pb,
    peg: metrics.peg,
    roe: metrics.roe,
    roic: metrics.roic,
    fcf: metrics.fcf,
    fcfMargin: metrics.fcf_margin,
    revenueGrowthYoy: metrics.revenue_growth_yoy,
    epsGrowthYoy: metrics.eps_growth_yoy,
    grossMargin: metrics.gross_margin,
    operatingMargin: metrics.operating_margin,
    netMargin: metrics.net_margin,
    debtToEquity: metrics.debt_to_equity,
    currentRatio: metrics.current_ratio,
    beta: metrics.beta,
    dividendYield: metrics.dividend_yield,
    week52High: metrics.week52_high,
    week52Low: metrics.week52_low,
  };
}

/**
 * 점수 계산 (기존 API 호환)
 */
export function calculateScore(metrics: MetricsInput): ScoreOutput {
  const providerMetrics = convertToProviderMetrics(metrics);
  const scores = calculateScores(providerMetrics);

  return {
    quality: scores.scoreQuality,
    growth: scores.scoreGrowth,
    value: scores.scoreValue,
    risk: scores.scoreRisk,
    total: scores.scoreTotal,
    explain: scores.explainText,
  };
}

/**
 * 52주 고점 대비 하락률 계산
 */
export function calculateDrawdown(
  currentPrice: number | null,
  week52High: number | null
): number | null {
  if (!currentPrice || !week52High || week52High === 0) {
    return null;
  }
  return ((week52High - currentPrice) / week52High) * 100;
}
