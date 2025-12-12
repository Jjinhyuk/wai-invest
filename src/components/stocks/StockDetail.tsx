'use client';

import { useState } from 'react';
import { ArrowLeft, Star, StarOff, Bell, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercent, formatMarketCap, formatDate, formatNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Ticker, MetricsLatest, Holding } from '@/types/database';

interface StockDetailProps {
  ticker: Ticker;
  metrics: MetricsLatest | null;
  isInWatchlist: boolean;
  watchlistId?: string;
  holding: Holding | null;
  userId: string;
}

export function StockDetail({
  ticker,
  metrics,
  isInWatchlist: initialIsInWatchlist,
  watchlistId,
  holding: initialHolding,
  userId,
}: StockDetailProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [holding, setHolding] = useState(initialHolding);
  const [quantity, setQuantity] = useState(holding?.quantity?.toString() || '');
  const [avgPrice, setAvgPrice] = useState(holding?.avg_price?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  // Calculate derived values
  const drawdown = metrics?.week52_high && metrics?.price
    ? ((metrics.week52_high - metrics.price) / metrics.week52_high) * 100
    : null;

  const position52w = metrics?.week52_high && metrics?.week52_low && metrics?.price
    ? ((metrics.price - metrics.week52_low) / (metrics.week52_high - metrics.week52_low)) * 100
    : null;

  const holdingValue = holding && metrics?.price
    ? holding.quantity * metrics.price
    : null;

  const holdingGainLoss = holding && metrics?.price
    ? (metrics.price - holding.avg_price) * holding.quantity
    : null;

  const holdingGainLossPercent = holding && metrics?.price
    ? ((metrics.price - holding.avg_price) / holding.avg_price) * 100
    : null;

  const toggleWatchlist = async () => {
    if (!watchlistId) return;

    if (isInWatchlist) {
      await supabase
        .from('watchlist_items')
        .delete()
        .eq('watchlist_id', watchlistId)
        .eq('symbol', ticker.symbol);
    } else {
      await supabase
        .from('watchlist_items')
        .insert({ watchlist_id: watchlistId, symbol: ticker.symbol });
    }
    setIsInWatchlist(!isInWatchlist);
  };

  const saveHolding = async () => {
    setIsSaving(true);
    try {
      const qty = parseFloat(quantity);
      const price = parseFloat(avgPrice);

      if (isNaN(qty) || isNaN(price)) {
        alert('Please enter valid numbers');
        return;
      }

      if (holding) {
        await supabase
          .from('holdings')
          .update({ quantity: qty, avg_price: price })
          .eq('id', holding.id);
        setHolding({ ...holding, quantity: qty, avg_price: price });
      } else {
        const { data } = await supabase
          .from('holdings')
          .insert({
            user_id: userId,
            symbol: ticker.symbol,
            quantity: qty,
            avg_price: price,
          })
          .select()
          .single();
        setHolding(data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const removeHolding = async () => {
    if (!holding) return;
    await supabase.from('holdings').delete().eq('id', holding.id);
    setHolding(null);
    setQuantity('');
    setAvgPrice('');
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/screener">
          <ArrowLeft className="h-4 w-4" />
          Back to Screener
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{ticker.symbol}</h1>
            <Badge variant="outline">{ticker.sector || 'N/A'}</Badge>
          </div>
          <p className="text-lg text-muted-foreground mt-1">{ticker.name}</p>
          {metrics?.as_of && (
            <p className="text-sm text-muted-foreground mt-1">
              Data as of {formatDate(metrics.as_of)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleWatchlist}>
            {isInWatchlist ? (
              <>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-2" />
                In Watchlist
              </>
            ) : (
              <>
                <StarOff className="h-4 w-4 mr-2" />
                Add to Watchlist
              </>
            )}
          </Button>
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics?.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-xl font-semibold">{formatMarketCap(metrics?.market_cap)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">52w Drawdown</p>
                  <p className={`text-xl font-semibold ${drawdown && drawdown > 20 ? 'text-red-600' : ''}`}>
                    {drawdown ? `-${drawdown.toFixed(1)}%` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                  <p className={`text-xl font-semibold ${getScoreColor(metrics?.score_total)}`}>
                    {metrics?.score_total?.toFixed(0) || '-'}/100
                  </p>
                </div>
              </div>

              {/* 52-week position */}
              {position52w !== null && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>52w Low: {formatCurrency(metrics?.week52_low)}</span>
                    <span>52w High: {formatCurrency(metrics?.week52_high)}</span>
                  </div>
                  <Progress value={position52w} className="h-3" />
                </div>
              )}

              {/* Explain text */}
              {metrics?.explain_text && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{metrics.explain_text}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed metrics tabs */}
          <Tabs defaultValue="metrics">
            <TabsList>
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
              <TabsTrigger value="risk">Risk Factors</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                    <MetricRow label="P/E Ratio" value={metrics?.pe?.toFixed(2)} />
                    <MetricRow label="P/S Ratio" value={metrics?.ps?.toFixed(2)} />
                    <MetricRow label="P/B Ratio" value={metrics?.pb?.toFixed(2)} />
                    <MetricRow label="PEG Ratio" value={metrics?.peg?.toFixed(2)} />
                    <MetricRow label="ROE" value={metrics?.roe ? formatPercent(metrics.roe * 100) : '-'} />
                    <MetricRow label="ROIC" value={metrics?.roic ? formatPercent(metrics.roic * 100) : '-'} />
                    <MetricRow label="Gross Margin" value={metrics?.gross_margin ? formatPercent(metrics.gross_margin * 100) : '-'} />
                    <MetricRow label="Operating Margin" value={metrics?.operating_margin ? formatPercent(metrics.operating_margin * 100) : '-'} />
                    <MetricRow label="Net Margin" value={metrics?.net_margin ? formatPercent(metrics.net_margin * 100) : '-'} />
                    <MetricRow label="Revenue Growth YoY" value={metrics?.revenue_growth_yoy ? formatPercent(metrics.revenue_growth_yoy * 100) : '-'} />
                    <MetricRow label="EPS Growth YoY" value={metrics?.eps_growth_yoy ? formatPercent(metrics.eps_growth_yoy * 100) : '-'} />
                    <MetricRow label="Dividend Yield" value={metrics?.dividend_yield ? formatPercent(metrics.dividend_yield * 100) : '-'} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scores">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <ScoreBar label="Quality (40%)" score={metrics?.score_quality} />
                  <ScoreBar label="Growth (30%)" score={metrics?.score_growth} />
                  <ScoreBar label="Value (20%)" score={metrics?.score_value} />
                  <ScoreBar label="Risk (10%)" score={metrics?.score_risk} />
                  <Separator />
                  <ScoreBar label="Total Score" score={metrics?.score_total} isTotal />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <RiskItem
                      label="Beta"
                      value={metrics?.beta?.toFixed(2) || '-'}
                      status={metrics?.beta && metrics.beta > 1.5 ? 'warning' : 'ok'}
                      description="Market volatility relative to S&P 500"
                    />
                    <RiskItem
                      label="Debt/Equity"
                      value={metrics?.debt_to_equity?.toFixed(2) || '-'}
                      status={metrics?.debt_to_equity && metrics.debt_to_equity > 1 ? 'warning' : 'ok'}
                      description="Financial leverage ratio"
                    />
                    <RiskItem
                      label="Current Ratio"
                      value={metrics?.current_ratio?.toFixed(2) || '-'}
                      status={metrics?.current_ratio && metrics.current_ratio < 1 ? 'warning' : 'ok'}
                      description="Short-term liquidity"
                    />
                    <RiskItem
                      label="FCF"
                      value={metrics?.fcf ? (metrics.fcf > 0 ? 'Positive' : 'Negative') : '-'}
                      status={metrics?.fcf && metrics.fcf < 0 ? 'warning' : 'ok'}
                      description="Free cash flow status"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - My Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Position</CardTitle>
              <CardDescription>
                {holding ? 'Update your holding' : 'Add this stock to your portfolio'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {holding && holdingValue && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Value</span>
                    <span className="font-semibold">{formatCurrency(holdingValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gain/Loss</span>
                    <span className={holdingGainLoss && holdingGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(holdingGainLoss)} ({formatPercent(holdingGainLossPercent)})
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Average Price</label>
                <Input
                  type="number"
                  placeholder="e.g., 150.00"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveHolding} disabled={isSaving} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  {holding ? 'Update' : 'Add'} Position
                </Button>
                {holding && (
                  <Button variant="destructive" size="icon" onClick={removeHolding}>
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value || '-'}</span>
    </div>
  );
}

function ScoreBar({ label, score, isTotal }: { label: string; score: number | null | undefined; isTotal?: boolean }) {
  const getColor = () => {
    if (!score) return 'bg-muted';
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={isTotal ? 'font-semibold' : ''}>{label}</span>
        <span className={isTotal ? 'font-bold' : 'font-medium'}>{score?.toFixed(0) || '-'}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getColor()}`}
          style={{ width: `${score || 0}%` }}
        />
      </div>
    </div>
  );
}

function RiskItem({
  label,
  value,
  status,
  description,
}: {
  label: string;
  value: string;
  status: 'ok' | 'warning';
  description: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
          {value}
        </p>
        <Badge variant={status === 'warning' ? 'warning' : 'success'} className="text-xs">
          {status === 'warning' ? 'Watch' : 'OK'}
        </Badge>
      </div>
    </div>
  );
}
