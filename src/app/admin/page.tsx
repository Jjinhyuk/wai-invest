import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Redirect if not admin
  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get stats
  const { count: tickerCount } = await supabase
    .from('tickers')
    .select('*', { count: 'exact', head: true });

  const { count: metricsCount } = await supabase
    .from('metrics_latest')
    .select('*', { count: 'exact', head: true });

  const { count: metricsWithScoreCount } = await supabase
    .from('metrics_latest')
    .select('*', { count: 'exact', head: true })
    .not('score_total', 'is', null);

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get recent jobs
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Get last metrics update
  const { data: latestMetrics } = await supabase
    .from('metrics_latest')
    .select('as_of')
    .order('as_of', { ascending: false })
    .limit(1)
    .single();

  return (
    <AppShell user={profile || undefined} isAdmin={true}>
      <AdminDashboard
        stats={{
          tickerCount: tickerCount || 0,
          metricsCount: metricsCount || 0,
          metricsWithScoreCount: metricsWithScoreCount || 0,
          userCount: userCount || 0,
          lastUpdate: latestMetrics?.as_of || null,
        }}
        recentJobs={recentJobs || []}
      />
    </AppShell>
  );
}
