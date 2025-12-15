import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { AppShell } from '@/components/layout';
import { AIRecommendationsContent } from '@/components/ai/AIRecommendationsContent';

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <AIRecommendationsContent />
    </AppShell>
  );
}
