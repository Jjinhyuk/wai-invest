import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { AIAnalysisContent } from '@/components/ai/AIAnalysisContent';

export default async function AIAnalysisPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get available tickers for autocomplete
  const { data: tickers } = await supabase
    .from('tickers')
    .select('symbol, name, sector')
    .eq('is_active', true)
    .order('symbol')
    .limit(500);

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <AIAnalysisContent tickers={tickers || []} />
    </AppShell>
  );
}
