import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider } from '@/lib/providers';

export async function POST() {
  const supabase = await createClient();

  // Check auth and admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const provider = getProvider();
    const tickers = await provider.listTickers();

    if (tickers.length === 0) {
      return NextResponse.json(
        { error: 'No tickers returned from provider' },
        { status: 500 }
      );
    }

    // Upsert tickers in batches
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize).map((t) => ({
        symbol: t.symbol,
        name: t.name,
        exchange: t.exchange,
        sector: t.sector,
        industry: t.industry,
        country: 'US',
        is_active: true,
      }));

      const { error } = await supabase
        .from('tickers')
        .upsert(batch, { onConflict: 'symbol' });

      if (error) {
        console.error('Batch insert error:', error);
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({ success: true, count: inserted });
  } catch (error) {
    console.error('Import tickers error:', error);
    return NextResponse.json(
      { error: 'Failed to import tickers' },
      { status: 500 }
    );
  }
}
