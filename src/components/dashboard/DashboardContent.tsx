'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Briefcase, Star, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils';
import { DataFreshness } from '@/components/common/DataFreshness';

interface DashboardContentProps {
  alertCandidates: any[];
  holdings: any[];
  watchlistCount: number;
  lastDataUpdate?: string | null;
}

export function DashboardContent({
  alertCandidates,
  holdings,
  watchlistCount,
  lastDataUpdate,
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
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">대시보드</h1>
          <p className="text-slate-500 mt-1">오늘의 투자 현황을 한눈에 확인하세요</p>
        </div>
        <DataFreshness lastUpdate={lastDataUpdate} />
      </div>

      {/* Quick stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">포트폴리오 가치</p>
                <p className="text-3xl font-bold mt-2">{formatLargeNumber(totalValue)}</p>
                <div className={`flex items-center gap-1 mt-2 ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {totalGainLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">{formatPercent(totalGainLossPercent)}</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Briefcase className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">관심 종목</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{watchlistCount}</p>
                <p className="text-sm text-slate-400 mt-2">종목 추적 중</p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
                <Star className="h-7 w-7 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">알림 후보</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{alertCandidates.length}</p>
                <p className="text-sm text-slate-400 mt-2">조건 충족 종목</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">보유 종목</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{holdings.length}</p>
                <p className="text-sm text-slate-400 mt-2">포트폴리오 구성</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert candidates */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">알림 후보 종목</CardTitle>
                <CardDescription className="mt-1">설정한 조건을 충족하는 종목들</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Link href="/screener">
                  전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alertCandidates.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-2">조건에 맞는 종목이 없습니다</p>
                <Button variant="link" asChild className="text-blue-600">
                  <Link href="/settings">알림 조건 설정하기</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {alertCandidates.slice(0, 5).map((stock) => {
                  const drawdown = stock.week52_high
                    ? ((stock.week52_high - stock.price) / stock.week52_high) * 100
                    : 0;
                  const scoreColor = stock.score_total >= 70 ? 'bg-green-100 text-green-700' :
                    stock.score_total >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

                  return (
                    <Link
                      key={stock.symbol}
                      href={`/stocks/${stock.symbol}`}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-700">
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{stock.symbol}</span>
                            <Badge className={`${scoreColor} border-0`}>
                              {stock.score_total?.toFixed(0)}점
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {stock.tickers?.name || stock.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatCurrency(stock.price)}</p>
                        <p className="text-sm text-red-500 flex items-center justify-end gap-1">
                          <TrendingDown className="h-3 w-3" />
                          고점 대비 -{drawdown.toFixed(1)}%
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
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900">포트폴리오 현황</CardTitle>
                <CardDescription className="mt-1">보유 비중 상위 종목</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Link href="/portfolio">
                  관리하기 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topHoldings.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-2">아직 보유 종목이 없습니다</p>
                <Button variant="link" asChild className="text-blue-600">
                  <Link href="/portfolio">포트폴리오 추가하기</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {topHoldings.map((holding) => {
                  const weight = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
                  const gainLoss = (holding.metrics_latest?.price || 0) - holding.avg_price;
                  const gainLossPercent = holding.avg_price > 0 ? (gainLoss / holding.avg_price) * 100 : 0;

                  return (
                    <div key={holding.symbol} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center font-semibold text-blue-700 text-sm">
                            {holding.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <Link
                              href={`/stocks/${holding.symbol}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {holding.symbol}
                            </Link>
                            <p className="text-sm text-slate-500">
                              {holding.quantity}주 보유
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatLargeNumber(holding.currentValue)}</p>
                          <p className={`text-sm flex items-center justify-end gap-1 ${gainLossPercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {gainLossPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(gainLossPercent)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Progress value={weight} className="h-2" />
                        <p className="text-xs text-slate-400">
                          포트폴리오의 {weight.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 to-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">빠른 실행</h3>
                <p className="text-slate-400 text-sm">자주 사용하는 기능에 빠르게 접근하세요</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/screener">스크리너 열기</Link>
              </Button>
              <Button variant="outline" asChild className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Link href="/portfolio">포트폴리오 관리</Link>
              </Button>
              <Button variant="outline" asChild className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Link href="/settings">알림 설정</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
