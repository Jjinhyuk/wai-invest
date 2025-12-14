/**
 * Stock Sync API
 * 종목 목록과 메트릭을 한 번에 동기화
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';
import { calculateScore } from '@/lib/scoring';

export const maxDuration = 60; // 최대 60초 실행

export async function POST(request: Request) {
  const supabase = await createClient();

  // 인증 및 권한 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 50; // 기본 50개 종목

    const provider = getProvider();

    // 1. 종목 목록 가져오기
    const allTickers = await provider.listTickers();
    const tickers = allTickers.slice(0, limit);

    if (tickers.length === 0) {
      return NextResponse.json(
        { error: 'No tickers available from provider' },
        { status: 500 }
      );
    }

    // 2. Tickers 테이블에 삽입
    const tickerInserts = tickers.map(t => ({
      symbol: t.symbol,
      name: t.name,
      exchange: t.exchange,
      sector: t.sector,
      industry: t.industry,
      country: 'US',
      is_active: true,
    }));

    const { error: tickerError } = await supabase
      .from('tickers')
      .upsert(tickerInserts, { onConflict: 'symbol' });

    if (tickerError) {
      console.error('Ticker upsert error:', tickerError);
    }

    // 3. 각 종목의 메트릭 가져오기 (rate limit 고려)
    let metricsUpdated = 0;
    let metricsFailed = 0;

    for (const ticker of tickers) {
      try {
        const metrics = await provider.getMetrics(ticker.symbol);

        if (metrics) {
          // 점수 계산
          const metricsForScore = {
            symbol: ticker.symbol,
            price: metrics.price,
            market_cap: metrics.marketCap,
            pe: metrics.pe,
            ps: metrics.ps,
            pb: metrics.pb,
            peg: metrics.peg,
            roe: metrics.roe,
            roic: metrics.roic,
            fcf: metrics.fcf,
            fcf_margin: metrics.fcfMargin,
            revenue_growth_yoy: metrics.revenueGrowthYoy,
            eps_growth_yoy: metrics.epsGrowthYoy,
            gross_margin: metrics.grossMargin,
            operating_margin: metrics.operatingMargin,
            net_margin: metrics.netMargin,
            debt_to_equity: metrics.debtToEquity,
            current_ratio: metrics.currentRatio,
            beta: metrics.beta,
            dividend_yield: metrics.dividendYield,
            week52_high: metrics.week52High,
            week52_low: metrics.week52Low,
          };

          const scores = calculateScore(metricsForScore);

          const { error: metricsError } = await supabase
            .from('metrics_latest')
            .upsert({
              symbol: ticker.symbol,
              price: metrics.price,
              market_cap: metrics.marketCap,
              pe: metrics.pe,
              ps: metrics.ps,
              pb: metrics.pb,
              peg: metrics.peg,
              roe: metrics.roe,
              roic: metrics.roic,
              fcf: metrics.fcf,
              fcf_margin: metrics.fcfMargin,
              revenue_growth_yoy: metrics.revenueGrowthYoy,
              eps_growth_yoy: metrics.epsGrowthYoy,
              gross_margin: metrics.grossMargin,
              operating_margin: metrics.operatingMargin,
              net_margin: metrics.netMargin,
              debt_to_equity: metrics.debtToEquity,
              current_ratio: metrics.currentRatio,
              beta: metrics.beta,
              dividend_yield: metrics.dividendYield,
              week52_high: metrics.week52High,
              week52_low: metrics.week52Low,
              score_quality: scores.quality,
              score_growth: scores.growth,
              score_value: scores.value,
              score_risk: scores.risk,
              score_total: scores.total,
              explain_text: scores.explain,
              as_of: new Date().toISOString(),
            });

          if (metricsError) {
            console.error(`Metrics upsert error for ${ticker.symbol}:`, metricsError);
            metricsFailed++;
          } else {
            metricsUpdated++;
          }
        } else {
          // 메트릭 없이 기본 데이터만 삽입
          const { error: metricsError } = await supabase
            .from('metrics_latest')
            .upsert({
              symbol: ticker.symbol,
              price: null,
              score_total: 50, // 기본 점수
              explain_text: '데이터 수집 중',
              as_of: new Date().toISOString(),
            });

          if (!metricsError) {
            metricsUpdated++;
          } else {
            metricsFailed++;
          }
        }

        // Rate limit 대기 (100ms)
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        console.error(`Error processing ${ticker.symbol}:`, error);
        metricsFailed++;
      }
    }

    return NextResponse.json({
      success: true,
      tickersImported: tickers.length,
      metricsUpdated,
      metricsFailed,
    });
  } catch (error) {
    console.error('Stock sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync stocks' },
      { status: 500 }
    );
  }
}
