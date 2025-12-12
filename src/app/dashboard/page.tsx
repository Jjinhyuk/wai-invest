import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

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

  // Get watchlist count
  const { count: watchlistCount } = await supabase
    .from('watchlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('watchlist_id', (
      await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .single()
    ).data?.id || '');

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <DashboardContent
        alertCandidates={alertCandidates || []}
        holdings={holdings || []}
        watchlistCount={watchlistCount || 0}
      />
    </AppShell>
  );
}
