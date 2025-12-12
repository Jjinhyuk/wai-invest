import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';
import { calculateScore } from '@/lib/scoring';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check auth and admin role
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
    const body = await request.json();
    const symbols: string[] = body.symbols || [];

    if (symbols.length === 0) {
      return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
    }

    const provider = getProvider();
    let updated = 0;
    let failed = 0;

    // Process symbols with delay to respect rate limits
    for (const symbol of symbols) {
      try {
        const metrics = await provider.getMetrics(symbol);

        if (metrics) {
          // Calculate scores
          const metricsForScore = {
            symbol,
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
            score_quality: null,
            score_growth: null,
            score_value: null,
            score_risk: null,
            score_total: null,
            explain_text: null,
            as_of: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const scores = calculateScore(metricsForScore as any);

          const { error } = await supabase.from('metrics_latest').upsert({
            symbol,
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

          if (error) {
            console.error(`Error updating ${symbol}:`, error);
            failed++;
          } else {
            updated++;
          }
        } else {
          failed++;
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
        failed++;
      }
    }

    return NextResponse.json({ success: true, updated, failed });
  } catch (error) {
    console.error('Update metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to update metrics' },
      { status: 500 }
    );
  }
}
