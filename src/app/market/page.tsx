import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { MarketContent } from '@/components/market/MarketContent';

export default async function MarketPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get sector performance from our stocks
  const { data: sectorData } = await supabase
    .from('metrics_latest')
    .select('tickers(sector), price, week52_high, score_total')
    .not('tickers', 'is', null);

  // Calculate sector performance
  const sectorPerformance = calculateSectorPerformance(sectorData || []);

  // Get top/bottom movers based on score and drawdown
  const { data: topScorers } = await supabase
    .from('metrics_latest')
    .select('*, tickers(*)')
    .gte('score_total', 70)
    .order('score_total', { ascending: false })
    .limit(5);

  const { data: biggestDrawdowns } = await supabase
    .from('metrics_latest')
    .select('*, tickers(*)')
    .not('week52_high', 'is', null)
    .not('price', 'is', null)
    .gte('score_total', 50)
    .order('week52_high', { ascending: false })
    .limit(10);

  // Filter for biggest drawdowns
  const drawdownStocks = (biggestDrawdowns || [])
    .map(stock => ({
      ...stock,
      drawdown: stock.week52_high && stock.price
        ? ((stock.week52_high - stock.price) / stock.week52_high) * 100
        : 0
    }))
    .filter(stock => stock.drawdown >= 20)
    .sort((a, b) => b.drawdown - a.drawdown)
    .slice(0, 5);

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <MarketContent
        sectorPerformance={sectorPerformance}
        topScorers={topScorers || []}
        drawdownOpportunities={drawdownStocks}
      />
    </AppShell>
  );
}

function calculateSectorPerformance(data: any[]) {
  const sectorMap: Record<string, { count: number; avgScore: number; avgDrawdown: number; stocks: any[] }> = {};

  data.forEach(item => {
    const sector = item.tickers?.sector || 'Other';
    if (!sectorMap[sector]) {
      sectorMap[sector] = { count: 0, avgScore: 0, avgDrawdown: 0, stocks: [] };
    }

    const drawdown = item.week52_high && item.price
      ? ((item.week52_high - item.price) / item.week52_high) * 100
      : 0;

    sectorMap[sector].count++;
    sectorMap[sector].avgScore += item.score_total || 0;
    sectorMap[sector].avgDrawdown += drawdown;
    sectorMap[sector].stocks.push(item);
  });

  return Object.entries(sectorMap).map(([sector, data]) => ({
    sector,
    count: data.count,
    avgScore: data.count > 0 ? data.avgScore / data.count : 0,
    avgDrawdown: data.count > 0 ? data.avgDrawdown / data.count : 0,
  })).sort((a, b) => b.count - a.count);
}
