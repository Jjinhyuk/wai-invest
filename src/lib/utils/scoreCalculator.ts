/**
 * Score Calculator
 * 주식 지표를 기반으로 품질, 성장, 가치, 위험 점수 계산
 */

import { ProviderMetrics } from '../providers/types';

export interface ScoreResult {
  scoreQuality: number;
  scoreGrowth: number;
  scoreValue: number;
  scoreRisk: number;
  scoreTotal: number;
  explainText: string;
}

/**
 * 지표를 점수로 변환 (0-100)
 */
function normalize(value: number | null, min: number, max: number, inverse: boolean = false): number {
  if (value === null || value === undefined || isNaN(value)) return 50; // 데이터 없으면 중립

  let score = ((value - min) / (max - min)) * 100;
  score = Math.max(0, Math.min(100, score));

  return inverse ? 100 - score : score;
}

/**
 * 품질 점수 계산 (ROE, ROIC, 마진, FCF)
 */
function calculateQualityScore(metrics: ProviderMetrics): { score: number; factors: string[] } {
  const factors: string[] = [];
  let totalScore = 0;
  let count = 0;

  // ROE (자기자본수익률) - 15%+ 우수
  if (metrics.roe !== null) {
    const roePercent = metrics.roe * 100;
    const roeScore = normalize(roePercent, 0, 30);
    totalScore += roeScore;
    count++;
    if (roePercent >= 15) factors.push(`ROE ${roePercent.toFixed(1)}% 우수`);
  }

  // ROIC (투하자본수익률) - 12%+ 우수
  if (metrics.roic !== null) {
    const roicPercent = metrics.roic * 100;
    const roicScore = normalize(roicPercent, 0, 25);
    totalScore += roicScore;
    count++;
    if (roicPercent >= 12) factors.push(`ROIC ${roicPercent.toFixed(1)}% 양호`);
  }

  // 영업이익률 - 20%+ 우수
  if (metrics.operatingMargin !== null) {
    const omPercent = metrics.operatingMargin * 100;
    const omScore = normalize(omPercent, 0, 40);
    totalScore += omScore;
    count++;
    if (omPercent >= 20) factors.push(`영업이익률 ${omPercent.toFixed(1)}%`);
  }

  // 순이익률 - 15%+ 우수
  if (metrics.netMargin !== null) {
    const nmPercent = metrics.netMargin * 100;
    const nmScore = normalize(nmPercent, 0, 30);
    totalScore += nmScore;
    count++;
    if (nmPercent >= 15) factors.push(`순이익률 ${nmPercent.toFixed(1)}%`);
  }

  // FCF 양수 여부
  if (metrics.fcf !== null) {
    const fcfScore = metrics.fcf > 0 ? 80 : 30;
    totalScore += fcfScore;
    count++;
    if (metrics.fcf > 0) factors.push('잉여현금흐름 양수');
  }

  return {
    score: count > 0 ? totalScore / count : 50,
    factors,
  };
}

/**
 * 성장 점수 계산 (매출 성장률, EPS 성장률)
 */
function calculateGrowthScore(metrics: ProviderMetrics): { score: number; factors: string[] } {
  const factors: string[] = [];
  let totalScore = 0;
  let count = 0;

  // 매출 성장률 - 10%+ 좋음, 20%+ 우수
  if (metrics.revenueGrowthYoy !== null) {
    const rgPercent = metrics.revenueGrowthYoy * 100;
    const rgScore = normalize(rgPercent, -10, 40);
    totalScore += rgScore;
    count++;
    if (rgPercent >= 10) factors.push(`매출 성장률 ${rgPercent.toFixed(1)}%`);
  }

  // EPS 성장률 - 15%+ 좋음
  if (metrics.epsGrowthYoy !== null) {
    const egPercent = metrics.epsGrowthYoy * 100;
    const egScore = normalize(egPercent, -20, 50);
    totalScore += egScore;
    count++;
    if (egPercent >= 15) factors.push(`EPS 성장률 ${egPercent.toFixed(1)}%`);
  }

  return {
    score: count > 0 ? totalScore / count : 50,
    factors,
  };
}

/**
 * 가치 점수 계산 (PER, PBR, PSR, PEG)
 */
function calculateValueScore(metrics: ProviderMetrics): { score: number; factors: string[] } {
  const factors: string[] = [];
  let totalScore = 0;
  let count = 0;

  // P/E - 낮을수록 좋음 (15 이하 저평가)
  if (metrics.pe !== null && metrics.pe > 0) {
    const peScore = normalize(metrics.pe, 5, 50, true);
    totalScore += peScore;
    count++;
    if (metrics.pe <= 15) factors.push(`P/E ${metrics.pe.toFixed(1)} 저평가`);
    else if (metrics.pe <= 25) factors.push(`P/E ${metrics.pe.toFixed(1)} 적정`);
  }

  // P/B - 낮을수록 좋음 (3 이하 양호)
  if (metrics.pb !== null && metrics.pb > 0) {
    const pbScore = normalize(metrics.pb, 0.5, 10, true);
    totalScore += pbScore;
    count++;
    if (metrics.pb <= 3) factors.push(`P/B ${metrics.pb.toFixed(1)}`);
  }

  // P/S - 낮을수록 좋음 (5 이하 양호)
  if (metrics.ps !== null && metrics.ps > 0) {
    const psScore = normalize(metrics.ps, 0.5, 15, true);
    totalScore += psScore;
    count++;
    if (metrics.ps <= 5) factors.push(`P/S ${metrics.ps.toFixed(1)}`);
  }

  // PEG - 1 이하 저평가, 1.5 이하 적정
  if (metrics.peg !== null && metrics.peg > 0) {
    const pegScore = normalize(metrics.peg, 0.5, 3, true);
    totalScore += pegScore * 1.5; // PEG에 가중치
    count += 1.5;
    if (metrics.peg <= 1) factors.push(`PEG ${metrics.peg.toFixed(2)} 저평가`);
    else if (metrics.peg <= 1.5) factors.push(`PEG ${metrics.peg.toFixed(2)} 적정`);
  }

  return {
    score: count > 0 ? totalScore / count : 50,
    factors,
  };
}

/**
 * 위험 점수 계산 (부채비율, 유동비율, 베타)
 * 점수가 높을수록 위험이 낮음
 */
function calculateRiskScore(metrics: ProviderMetrics): { score: number; factors: string[] } {
  const factors: string[] = [];
  let totalScore = 0;
  let count = 0;

  // 부채비율 (D/E) - 낮을수록 좋음 (1 이하 양호)
  if (metrics.debtToEquity !== null) {
    const deScore = normalize(metrics.debtToEquity, 0, 3, true);
    totalScore += deScore;
    count++;
    if (metrics.debtToEquity <= 1) factors.push(`D/E ${metrics.debtToEquity.toFixed(2)} 안정`);
  }

  // 유동비율 - 높을수록 좋음 (1.5+ 양호)
  if (metrics.currentRatio !== null) {
    const crScore = normalize(metrics.currentRatio, 0.5, 3);
    totalScore += crScore;
    count++;
    if (metrics.currentRatio >= 1.5) factors.push(`유동비율 ${metrics.currentRatio.toFixed(2)}`);
  }

  // 베타 - 1 근처가 이상적
  if (metrics.beta !== null) {
    // 베타가 1에서 멀수록 점수 낮음
    const betaDiff = Math.abs(metrics.beta - 1);
    const betaScore = normalize(betaDiff, 0, 1.5, true);
    totalScore += betaScore;
    count++;
    if (metrics.beta >= 0.8 && metrics.beta <= 1.2) factors.push(`베타 ${metrics.beta.toFixed(2)} 안정`);
  }

  return {
    score: count > 0 ? totalScore / count : 50,
    factors,
  };
}

/**
 * 종합 점수 계산
 */
export function calculateScores(metrics: ProviderMetrics): ScoreResult {
  const quality = calculateQualityScore(metrics);
  const growth = calculateGrowthScore(metrics);
  const value = calculateValueScore(metrics);
  const risk = calculateRiskScore(metrics);

  // 가중 평균 (품질 30%, 성장 25%, 가치 25%, 위험 20%)
  const total =
    quality.score * 0.3 +
    growth.score * 0.25 +
    value.score * 0.25 +
    risk.score * 0.2;

  // 설명 텍스트 생성
  const allFactors = [...quality.factors, ...growth.factors, ...value.factors, ...risk.factors];
  const explainText = allFactors.slice(0, 3).join(', ') || '분석 데이터 부족';

  return {
    scoreQuality: Math.round(quality.score * 10) / 10,
    scoreGrowth: Math.round(growth.score * 10) / 10,
    scoreValue: Math.round(value.score * 10) / 10,
    scoreRisk: Math.round(risk.score * 10) / 10,
    scoreTotal: Math.round(total * 10) / 10,
    explainText,
  };
}
