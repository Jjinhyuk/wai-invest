import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user should be admin
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const adminEmails = (process.env.ADMIN_EMAIL_ALLOWLIST || '')
          .split(',')
          .map((e) => e.trim().toLowerCase());

        const isAdmin = adminEmails.includes(user.email?.toLowerCase() || '');

        // Update profile role if admin
        if (isAdmin) {
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
