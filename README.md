# WAI-Invest

US Stock Analysis, Portfolio Tracking, and Smart Alerts

## Overview

WAI-Invest is a personal investment tool for analyzing US stocks, tracking your portfolio, and receiving smart alerts when stocks match your criteria.

### Features

- **Stock Screener**: Filter stocks by quality, growth, value, and risk scores
- **Stock Details**: View comprehensive metrics, scores, and risk factors
- **Portfolio Tracking**: Import holdings via CSV/XLSX, track performance
- **Smart Alerts**: Daily email alerts for stocks matching your criteria
- **Admin Panel**: Manage data imports and user accounts

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Email**: Resend
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google Cloud Console project (for OAuth)
- (Optional) FMP API key for stock data
- (Optional) Resend API key for email alerts

### Environment Variables

Create `.env.local` with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stock Data Provider
STOCK_PROVIDER=fmp
FMP_API_KEY=your_fmp_api_key

# Admin Access
ADMIN_EMAIL_ALLOWLIST=your_email@gmail.com

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Cron Security
CRON_SECRET=your_random_secret
```

### Database Setup

1. Go to Supabase SQL Editor
2. Run the migration in `supabase/migrations/001_initial_schema.sql`

### Supabase Auth Setup

1. Enable Google provider in Supabase Authentication
2. Configure OAuth credentials from Google Cloud Console
3. Set redirect URL to `https://your-domain.com/auth/callback`

### Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add all environment variables
3. Deploy

### Cron Jobs

The alert cron job runs daily at 08:00 KST (23:00 UTC).

Configure in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/alerts",
      "schedule": "0 23 * * *"
    }
  ]
}
```

## Admin Access

1. Add your Google email to `ADMIN_EMAIL_ALLOWLIST`
2. Log in with that Google account
3. Access `/admin` to manage data

### Admin Tasks

- **Import Tickers**: Fetch US stock list from provider
- **Update Metrics**: Batch update stock metrics (50 at a time)
- **View Users**: See registered users

## Scoring System

Stocks are scored on a 0-100 scale:

- **Quality (40%)**: ROE, ROIC, FCF margin, gross margin
- **Growth (30%)**: Revenue growth YoY, EPS growth YoY
- **Value (20%)**: PEG, P/E, P/S ratios
- **Risk (10%)**: Beta, Debt/Equity, Current ratio

## Alert Criteria

Configure in Settings:

- **Drawdown Range**: 52-week high drawdown (default: 20-50%)
- **PEG Maximum**: Maximum PEG ratio (default: 1.5)
- **Minimum Score**: Minimum total score (default: 60)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   ├── auth/              # Auth callback
│   ├── dashboard/         # Main dashboard
│   ├── portfolio/         # Portfolio management
│   ├── screener/          # Stock screener
│   ├── settings/          # User settings
│   └── stocks/[symbol]/   # Stock details
├── components/            # React components
│   ├── admin/
│   ├── dashboard/
│   ├── layout/
│   ├── portfolio/
│   ├── screener/
│   ├── settings/
│   ├── stocks/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── providers/        # Stock data providers
│   ├── scoring/          # Score calculation
│   ├── supabase/         # Supabase clients
│   └── utils/            # Utility functions
├── types/                # TypeScript types
└── middleware.ts         # Auth middleware
```

## Default Values

- **Data Cache**: Metrics with `as_of` within 24 hours are not re-fetched
- **Batch Size**: 50 stocks per metrics update batch
- **Alert Time**: 08:00 KST daily
- **Alert Limit**: Top 30 matching stocks per email

## License

Private - Personal Use Only
