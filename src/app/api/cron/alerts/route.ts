import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { calculateDrawdown } from '@/lib/scoring';
import { formatCurrency, formatPercent } from '@/lib/utils';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return true; // Skip check if not configured
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  try {
    // Get all users with alerts enabled
    const { data: alertSettings } = await supabase
      .from('alert_settings')
      .select('*, profiles(email)')
      .eq('enabled', true);

    if (!alertSettings || alertSettings.length === 0) {
      return NextResponse.json({ message: 'No users with alerts enabled' });
    }

    // Get all metrics for matching
    const { data: allMetrics } = await supabase
      .from('metrics_latest')
      .select('*, tickers(name, sector)')
      .not('price', 'is', null)
      .not('week52_high', 'is', null);

    if (!allMetrics || allMetrics.length === 0) {
      return NextResponse.json({ message: 'No metrics available' });
    }

    const results: { userId: string; matched: number; emailSent: boolean }[] = [];

    // Process each user
    for (const settings of alertSettings) {
      const { user_id, drawdown_min_percent, drawdown_max_percent, peg_max, min_score, profiles } = settings;
      const userEmail = (profiles as any)?.email;

      if (!userEmail) continue;

      // Find matching stocks
      const matchedStocks = allMetrics
        .map((stock) => {
          const drawdown = calculateDrawdown(stock.price, stock.week52_high);
          return { ...stock, drawdown };
        })
        .filter((stock) => {
          if (stock.drawdown === null) return false;
          if (stock.drawdown < drawdown_min_percent || stock.drawdown > drawdown_max_percent) return false;
          if (stock.peg !== null && stock.peg > peg_max) return false;
          if (stock.score_total !== null && stock.score_total < min_score) return false;
          return true;
        })
        .sort((a, b) => (b.score_total || 0) - (a.score_total || 0))
        .slice(0, 30);

      // Record alert event
      const alertPayload = {
        symbols: matchedStocks.map((s) => s.symbol),
        summary: `Found ${matchedStocks.length} stocks matching your criteria`,
        criteria: {
          drawdown_range: [drawdown_min_percent, drawdown_max_percent],
          peg_max,
          min_score,
        },
      };

      let emailSent = false;

      // Send email if we have matches and Resend is configured
      if (matchedStocks.length > 0 && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);

          const emailHtml = generateEmailHtml(matchedStocks, settings);

          await resend.emails.send({
            from: 'WAI-Invest <alerts@wai-invest.com>',
            to: userEmail,
            subject: `[WAI-Invest] ${matchedStocks.length} stocks match your criteria`,
            html: emailHtml,
          });

          emailSent = true;
        } catch (emailError) {
          console.error('Email send error:', emailError);
        }
      }

      // Save alert event
      await supabase.from('alert_events').insert({
        user_id,
        run_at: new Date().toISOString(),
        matched_count: matchedStocks.length,
        payload: alertPayload,
        email_sent: emailSent,
      });

      results.push({
        userId: user_id,
        matched: matchedStocks.length,
        emailSent,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Cron alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to process alerts' },
      { status: 500 }
    );
  }
}

function generateEmailHtml(stocks: any[], settings: any): string {
  const stockRows = stocks
    .map((stock) => {
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            <strong>${stock.symbol}</strong><br>
            <small style="color: #666;">${stock.tickers?.name || ''}</small>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${formatCurrency(stock.price)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626;">
            -${stock.drawdown?.toFixed(1)}%
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${stock.peg?.toFixed(2) || '-'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${stock.score_total?.toFixed(0) || '-'}/100
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e40af;">WAI-Invest Daily Alert</h1>

      <p>Found <strong>${stocks.length} stocks</strong> matching your criteria:</p>

      <ul style="color: #666; font-size: 14px;">
        <li>Drawdown: ${settings.drawdown_min_percent}% - ${settings.drawdown_max_percent}%</li>
        <li>PEG: &le; ${settings.peg_max}</li>
        <li>Score: &ge; ${settings.min_score}</li>
      </ul>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Stock</th>
            <th style="padding: 8px; text-align: left;">Price</th>
            <th style="padding: 8px; text-align: left;">Drawdown</th>
            <th style="padding: 8px; text-align: left;">PEG</th>
            <th style="padding: 8px; text-align: left;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${stockRows}
        </tbody>
      </table>

      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        <a href="https://wai-invest.vercel.app/screener">View all in Screener</a> |
        <a href="https://wai-invest.vercel.app/settings">Manage alert settings</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

      <p style="font-size: 11px; color: #999;">
        This email was sent by WAI-Invest. You're receiving this because you enabled daily alerts.
      </p>
    </body>
    </html>
  `;
}
