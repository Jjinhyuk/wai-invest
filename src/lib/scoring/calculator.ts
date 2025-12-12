// Stock scoring calculator
// Weights: Quality(40%) + Growth(30%) + Value(20%) + Risk(10%)

import { MetricsLatest } from '@/types/database';

export interface ScoreBreakdown {
  quality: number;
  growth: number;
  value: number;
  risk: number;
  total: number;
  explain: string;
}

// Normalize a value to 0-100 scale
function normalize(
  value: number | null,
  min: number,
  max: number,
  inverse = false
): number {
  if (value === null || value === undefined) return 50; // Neutral score for missing data

  const clamped = Math.max(min, Math.min(max, value));
  const normalized = ((clamped - min) / (max - min)) * 100;

  return inverse ? 100 - normalized : normalized;
}

// Calculate quality score (40% weight)
// Based on: ROE, ROIC, FCF margin, gross margin
function calculateQualityScore(metrics: MetricsLatest): number {
  const scores: number[] = [];

  // ROE: 0-30% is good range
  if (metrics.roe !== null) {
    scores.push(normalize(metrics.roe * 100, 0, 30));
  }

  // ROIC: 0-25% is good range
  if (metrics.roic !== null) {
    scores.push(normalize(metrics.roic * 100, 0, 25));
  }

  // FCF margin: 0-20% is good range
  if (metrics.fcf_margin !== null) {
    scores.push(normalize(metrics.fcf_margin * 100, -5, 20));
  }

  // Gross margin: 20-60% is typical
  if (metrics.gross_margin !== null) {
    scores.push(normalize(metrics.gross_margin * 100, 20, 60));
  }

  // FCF positive is a bonus
  if (metrics.fcf !== null && metrics.fcf > 0) {
    scores.push(80);
  } else if (metrics.fcf !== null) {
    scores.push(30);
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 50;
}

// Calculate growth score (30% weight)
// Based on: Revenue growth YoY, EPS growth YoY
function calculateGrowthScore(metrics: MetricsLatest): number {
  const scores: number[] = [];

  // Revenue growth: -10% to 40% range
  if (metrics.revenue_growth_yoy !== null) {
    scores.push(normalize(metrics.revenue_growth_yoy * 100, -10, 40));
  }

  // EPS growth: -20% to 50% range
  if (metrics.eps_growth_yoy !== null) {
    scores.push(normalize(metrics.eps_growth_yoy * 100, -20, 50));
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 50;
}

// Calculate value score (20% weight)
// Based on: PEG, P/E, P/S (lower is better for value)
function calculateValueScore(metrics: MetricsLatest): number {
  const scores: number[] = [];

  // PEG: 0-3 range (lower is better)
  if (metrics.peg !== null && metrics.peg > 0) {
    scores.push(normalize(metrics.peg, 0, 3, true));
  }

  // P/E: 5-50 range (lower generally better, but not too low)
  if (metrics.pe !== null && metrics.pe > 0) {
    scores.push(normalize(metrics.pe, 5, 50, true));
  }

  // P/S: 0-15 range (lower is better)
  if (metrics.ps !== null && metrics.ps > 0) {
    scores.push(normalize(metrics.ps, 0, 15, true));
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 50;
}

// Calculate risk score (10% weight)
// Based on: Beta, Debt/Equity, Current ratio
function calculateRiskScore(metrics: MetricsLatest): number {
  const scores: number[] = [];

  // Beta: 0.5-2.0 range (lower is less risky)
  if (metrics.beta !== null) {
    scores.push(normalize(metrics.beta, 0.5, 2.0, true));
  }

  // Debt/Equity: 0-2 range (lower is better)
  if (metrics.debt_to_equity !== null && metrics.debt_to_equity >= 0) {
    scores.push(normalize(metrics.debt_to_equity, 0, 2, true));
  }

  // Current ratio: 1-3 range (higher is better, but 1+ is key)
  if (metrics.current_ratio !== null) {
    scores.push(normalize(metrics.current_ratio, 0.5, 3));
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 50;
}

// Generate explain text
function generateExplainText(
  metrics: MetricsLatest,
  scores: ScoreBreakdown
): string {
  const parts: string[] = [];

  // ROE
  if (metrics.roe !== null) {
    const roePercent = (metrics.roe * 100).toFixed(1);
    parts.push(`ROE ${roePercent}%`);
  }

  // FCF status
  if (metrics.fcf !== null) {
    parts.push(metrics.fcf > 0 ? 'FCF+' : 'FCF-');
  }

  // 52-week drawdown
  if (metrics.price && metrics.week52_high) {
    const drawdown = ((metrics.week52_high - metrics.price) / metrics.week52_high) * 100;
    parts.push(`52w high -${drawdown.toFixed(0)}%`);
  }

  // PEG
  if (metrics.peg !== null && metrics.peg > 0) {
    parts.push(`PEG ${metrics.peg.toFixed(2)}`);
  }

  // Score summary
  parts.push(`Score: ${scores.total.toFixed(0)}/100`);

  return parts.join(', ');
}

// Main scoring function
export function calculateScore(metrics: MetricsLatest): ScoreBreakdown {
  const quality = calculateQualityScore(metrics);
  const growth = calculateGrowthScore(metrics);
  const value = calculateValueScore(metrics);
  const risk = calculateRiskScore(metrics);

  // Weighted total
  const total = quality * 0.4 + growth * 0.3 + value * 0.2 + risk * 0.1;

  const breakdown: ScoreBreakdown = {
    quality: Math.round(quality * 100) / 100,
    growth: Math.round(growth * 100) / 100,
    value: Math.round(value * 100) / 100,
    risk: Math.round(risk * 100) / 100,
    total: Math.round(total * 100) / 100,
    explain: '',
  };

  breakdown.explain = generateExplainText(metrics, breakdown);

  return breakdown;
}

// Calculate drawdown percentage
export function calculateDrawdown(price: number | null, week52High: number | null): number | null {
  if (!price || !week52High || week52High === 0) return null;
  return ((week52High - price) / week52High) * 100;
}

// Check if stock matches alert criteria
export function matchesAlertCriteria(
  metrics: MetricsLatest,
  settings: {
    drawdownMin: number;
    drawdownMax: number;
    pegMax: number;
    minScore: number;
  }
): boolean {
  const drawdown = calculateDrawdown(metrics.price, metrics.week52_high);

  // Check drawdown range
  if (drawdown === null) return false;
  if (drawdown < settings.drawdownMin || drawdown > settings.drawdownMax) return false;

  // Check PEG (skip if null, or check if within limit)
  if (metrics.peg !== null && metrics.peg > settings.pegMax) return false;

  // Check minimum score
  if (metrics.score_total !== null && metrics.score_total < settings.minScore) return false;

  return true;
}
