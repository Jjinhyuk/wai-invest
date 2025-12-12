import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout';
import { PortfolioContent } from '@/components/portfolio/PortfolioContent';

export default async function PortfolioPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's holdings with ticker info and metrics
  const { data: holdings } = await supabase
    .from('holdings')
    .select('*, tickers(*), metrics_latest(*)')
    .eq('user_id', user.id);

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <PortfolioContent
        holdings={holdings || []}
        userId={user.id}
      />
    </AppShell>
  );
}
