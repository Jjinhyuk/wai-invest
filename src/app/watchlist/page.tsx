import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { WatchlistContent } from '@/components/watchlist/WatchlistContent';

export default async function WatchlistPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get or create watchlist
  let { data: watchlist } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!watchlist) {
    const { data: newWatchlist } = await supabase
      .from('watchlists')
      .insert({ user_id: user.id, name: 'My Watchlist' })
      .select()
      .single();
    watchlist = newWatchlist;
  }

  // Get watchlist items with stock details
  const { data: watchlistItems } = await supabase
    .from('watchlist_items')
    .select('*, tickers(*), metrics_latest(*)')
    .eq('watchlist_id', watchlist?.id || '');

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <WatchlistContent
        watchlistId={watchlist?.id || ''}
        watchlistItems={watchlistItems || []}
      />
    </AppShell>
  );
}
