import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get alert candidates (stocks matching criteria)
  const { data: alertCandidates } = await supabase
    .from('metrics_latest')
    .select('*, tickers(*)')
    .not('week52_high', 'is', null)
    .not('price', 'is', null)
    .gte('score_total', 60)
    .order('score_total', { ascending: false })
    .limit(10);

  // Get user's holdings summary
  const { data: holdings } = await supabase
    .from('holdings')
    .select('*, tickers(*), metrics_latest(*)')
    .eq('user_id', user.id);

  // Get watchlist
  const { data: watchlist } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // Get watchlist count
  const { count: watchlistCount } = await supabase
    .from('watchlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('watchlist_id', watchlist?.id || '');

  // Get last data update time
  const { data: lastUpdate } = await supabase
    .from('metrics_latest')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <OnboardingModal
        userId={user.id}
        hasPortfolio={(holdings?.length || 0) > 0}
        hasWatchlist={(watchlistCount || 0) > 0}
      />
      <DashboardContent
        alertCandidates={alertCandidates || []}
        holdings={holdings || []}
        watchlistCount={watchlistCount || 0}
        lastDataUpdate={lastUpdate?.updated_at}
      />
    </AppShell>
  );
}
