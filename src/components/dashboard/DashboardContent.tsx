'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, AlertTriangle, Briefcase, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, formatLargeNumber, formatRelativeTime } from '@/lib/utils';

interface DashboardContentProps {
  alertCandidates: any[];
  holdings: any[];
  watchlistCount: number;
}

export function DashboardContent({
  alertCandidates,
  holdings,
  watchlistCount,
}: DashboardContentProps) {
  // Calculate portfolio summary
  const totalValue = holdings.reduce((sum, h) => {
    const price = h.metrics_latest?.price || 0;
    return sum + h.quantity * price;
  }, 0);

  const totalCost = holdings.reduce((sum, h) => {
    return sum + h.quantity * h.avg_price;
  }, 0);

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Top holdings by value
  const topHoldings = holdings
    .map((h) => ({
      ...h,
      currentValue: h.quantity * (h.metrics_latest?.price || 0),
    }))
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your daily investment summary</p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(totalValue)}</div>
            <p className={`text-xs ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(totalGainLossPercent)} all time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watchlist</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchlistCount}</div>
            <p className="text-xs text-muted-foreground">stocks tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Candidates</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCandidates.length}</div>
            <p className="text-xs text-muted-foreground">matching your criteria</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holdings.length}</div>
            <p className="text-xs text-muted-foreground">stocks in portfolio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert candidates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Alert Candidates</CardTitle>
                <CardDescription>Stocks matching your alert criteria</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/screener">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alertCandidates.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No stocks match your criteria yet.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/settings">Adjust alert settings</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {alertCandidates.slice(0, 5).map((stock) => {
                  const drawdown = stock.week52_high
                    ? ((stock.week52_high - stock.price) / stock.week52_high) * 100
                    : 0;

                  return (
                    <Link
                      key={stock.symbol}
                      href={`/stocks/${stock.symbol}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{stock.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            Score: {stock.score_total?.toFixed(0)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stock.tickers?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(stock.price)}</p>
                        <p className="text-xs text-red-600">
                          -{drawdown.toFixed(1)}% from 52w high
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>Your top holdings by value</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portfolio">
                  Manage <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topHoldings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Briefcase className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No holdings yet.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/portfolio">Add your portfolio</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {topHoldings.map((holding) => {
                  const weight = (holding.currentValue / totalValue) * 100;
                  const gainLoss = (holding.metrics_latest?.price || 0) - holding.avg_price;
                  const gainLossPercent = (gainLoss / holding.avg_price) * 100;

                  return (
                    <div key={holding.symbol} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            href={`/stocks/${holding.symbol}`}
                            className="font-medium hover:underline"
                          >
                            {holding.symbol}
                          </Link>
                          <span className="ml-2 text-sm text-muted-foreground">
                            {holding.quantity} shares
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatLargeNumber(holding.currentValue)}</p>
                          <p className={`text-xs ${gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(gainLossPercent)}
                          </p>
                        </div>
                      </div>
                      <Progress value={weight} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {weight.toFixed(1)}% of portfolio
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/screener">Open Screener</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/portfolio">Upload Portfolio</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/settings">Alert Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
