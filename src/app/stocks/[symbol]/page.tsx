import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout';
import { StockDetail } from '@/components/stocks/StockDetail';

interface Props {
  params: Promise<{ symbol: string }>;
}

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get stock info
  const { data: ticker } = await supabase
    .from('tickers')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (!ticker) notFound();

  // Get metrics
  const { data: metrics } = await supabase
    .from('metrics_latest')
    .select('*')
    .eq('symbol', symbol.toUpperCase())
    .single();

  // Check if in watchlist
  const { data: watchlist } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: watchlistItem } = await supabase
    .from('watchlist_items')
    .select('symbol')
    .eq('watchlist_id', watchlist?.id || '')
    .eq('symbol', symbol.toUpperCase())
    .single();

  // Check if in holdings
  const { data: holding } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol.toUpperCase())
    .single();

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <StockDetail
        ticker={ticker}
        metrics={metrics}
        isInWatchlist={!!watchlistItem}
        watchlistId={watchlist?.id}
        holding={holding}
        userId={user.id}
      />
    </AppShell>
  );
}
