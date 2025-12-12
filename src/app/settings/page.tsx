import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout';
import { SettingsContent } from '@/components/settings/SettingsContent';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get or create alert settings
  let { data: alertSettings } = await supabase
    .from('alert_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!alertSettings) {
    // Create default settings
    const { data: newSettings } = await supabase
      .from('alert_settings')
      .insert({
        user_id: user.id,
        enabled: true,
        drawdown_min_percent: 20,
        drawdown_max_percent: 50,
        peg_max: 1.5,
        min_score: 60,
      })
      .select()
      .single();
    alertSettings = newSettings;
  }

  // Get recent alert events
  const { data: alertEvents } = await supabase
    .from('alert_events')
    .select('*')
    .eq('user_id', user.id)
    .order('run_at', { ascending: false })
    .limit(5);

  return (
    <AppShell
      user={profile || undefined}
      isAdmin={profile?.role === 'admin'}
    >
      <SettingsContent
        alertSettings={alertSettings!}
        alertEvents={alertEvents || []}
        userEmail={user.email || ''}
      />
    </AppShell>
  );
}
