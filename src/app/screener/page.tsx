import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { ScreenerContent } from '@/components/screener/ScreenerContent';

export default async function ScreenerPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get all stocks with metrics
  const { data: stocks, count } = await supabase
    .from('metrics_latest')
    .select('*, tickers!inner(*)', { count: 'exact' })
    .eq('tickers.is_active', true)
    .not('score_total', 'is', null)
    .order('score_total', { ascending: false })
    .limit(100);

  // Get user's watchlist items for quick add
  const { data: watchlist } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const { data: watchlistItems } = await supabase
    .from('watchlist_items')
    .select('symbol')
    .eq('watchlist_id', watchlist?.id || '');

  const watchlistSymbols = new Set(watchlistItems?.map((w) => w.symbol) || []);

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <ScreenerContent
        stocks={stocks || []}
        totalCount={count || 0}
        watchlistId={watchlist?.id}
        watchlistSymbols={watchlistSymbols}
      />
    </AppShell>
  );
}
