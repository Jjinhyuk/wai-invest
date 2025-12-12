import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { AdminDataContent } from '@/components/admin/AdminDataContent';

export default async function AdminDataPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get jobs with their runs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get stats
  const { count: tickerCount } = await supabase
    .from('tickers')
    .select('*', { count: 'exact', head: true });

  const { count: metricsCount } = await supabase
    .from('metrics_latest')
    .select('*', { count: 'exact', head: true });

  // Get tickers without metrics - simplified query
  const { data: allTickers } = await supabase
    .from('tickers')
    .select('symbol')
    .limit(500);

  const { data: tickersWithMetrics } = await supabase
    .from('metrics_latest')
    .select('symbol')
    .limit(10000);

  const metricsSymbolSet = new Set(tickersWithMetrics?.map(t => t.symbol) || []);
  const tickersWithoutMetrics = (allTickers || [])
    .filter(t => !metricsSymbolSet.has(t.symbol))
    .slice(0, 100);

  return (
    <AppShell user={profile || undefined} isAdmin={true}>
      <AdminDataContent
        jobs={jobs || []}
        tickerCount={tickerCount || 0}
        metricsCount={metricsCount || 0}
        tickersWithoutMetrics={tickersWithoutMetrics.map((t) => t.symbol)}
        userId={user.id}
      />
    </AppShell>
  );
}
