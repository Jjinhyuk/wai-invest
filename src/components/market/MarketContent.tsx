'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Globe,
  Zap,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Clock,
  Flame,
  Target,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface MarketContentProps {
  sectorPerformance: {
    sector: string;
    count: number;
    avgScore: number;
    avgDrawdown: number;
  }[];
  topScorers: any[];
  drawdownOpportunities: any[];
}

// Mock market data - in production, fetch from FMP API
const marketIndices = [
  { symbol: 'SPY', name: 'S&P 500', price: 5998.74, change: 1.23, changePercent: 0.45 },
  { symbol: 'QQQ', name: 'NASDAQ', price: 21234.56, change: -45.67, changePercent: -0.21 },
  { symbol: 'DIA', name: 'DOW 30', price: 44642.15, change: 125.43, changePercent: 0.28 },
  { symbol: 'IWM', name: 'Russell 2000', price: 2342.87, change: 18.34, changePercent: 0.79 },
];

const marketIndicators = [
  { symbol: 'VIX', name: '공포지수', value: 13.45, status: 'low' as const },
  { symbol: 'DXY', name: '달러 인덱스', value: 106.82, change: 0.15 },
  { symbol: 'TNX', name: '미국 10년물', value: 4.23, unit: '%' },
  { symbol: 'USDKRW', name: '원/달러', value: 1385.50, change: -2.30 },
];

const commodities = [
  { symbol: 'GC', name: '금', price: 2658.40, change: 12.30, changePercent: 0.46 },
  { symbol: 'CL', name: '원유(WTI)', price: 71.24, change: -0.87, changePercent: -1.21 },
  { symbol: 'BTC', name: '비트코인', price: 101234, change: 2345, changePercent: 2.37 },
];

export function MarketContent({
  sectorPerformance,
  topScorers,
  drawdownOpportunities,
}: MarketContentProps) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
  }, []);

  // Fear & Greed calculation (simplified)
  const vix = marketIndicators.find(i => i.symbol === 'VIX')?.value || 20;
  const fearGreedScore = Math.max(0, Math.min(100, 100 - (vix - 10) * 3));
  const fearGreedLabel = fearGreedScore >= 70 ? '탐욕' : fearGreedScore >= 50 ? '중립' : fearGreedScore >= 30 ? '두려움' : '극단적 두려움';
  const fearGreedColor = fearGreedScore >= 70 ? 'text-green-600' : fearGreedScore >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">시장 현황</h1>
          <p className="text-slate-500 mt-1">미국 시장 전체 상황을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4" />
          <span>업데이트: {mounted && lastUpdate ? lastUpdate.toLocaleTimeString('ko-KR') : '--:--:--'}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLastUpdate(new Date())}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Market Status Banner */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <p className="text-slate-300 text-sm">미국 증시 상태</p>
                <p className="text-2xl font-bold mt-1">
                  {mounted && lastUpdate
                    ? (lastUpdate.getHours() >= 22 || lastUpdate.getHours() < 5
                        ? '🟢 거래 중 (Pre/After)'
                        : '⚪ 휴장')
                    : '⏳ 확인 중...'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  정규장: 23:30 - 06:00 (KST)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Fear & Greed Index */}
              <div className="text-center">
                <p className="text-slate-400 text-xs mb-1">Fear & Greed</p>
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${fearGreedScore * 2.51} 251`}
                      className={fearGreedColor}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{fearGreedScore}</span>
                    <span className="text-xs text-slate-400">{fearGreedLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Indices */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          주요 지수
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {marketIndices.map((index) => (
            <Card key={index.symbol} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{index.name}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {index.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    index.changePercent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {index.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-semibold text-sm">
                      {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <p className={`text-sm mt-2 ${index.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} 포인트
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Indicators & Commodities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Indicators */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              시장 지표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketIndicators.map((indicator) => (
                <div key={indicator.symbol} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      indicator.symbol === 'VIX'
                        ? indicator.status === 'low' ? 'bg-green-100' : 'bg-red-100'
                        : 'bg-slate-200'
                    }`}>
                      {indicator.symbol === 'VIX' ? (
                        <AlertTriangle className={`h-5 w-5 ${indicator.status === 'low' ? 'text-green-600' : 'text-red-600'}`} />
                      ) : (
                        <DollarSign className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{indicator.name}</p>
                      <p className="text-xs text-slate-500">{indicator.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {indicator.value.toLocaleString()}{indicator.unit || ''}
                    </p>
                    {indicator.change !== undefined && (
                      <p className={`text-sm ${indicator.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {indicator.change >= 0 ? '+' : ''}{indicator.change.toFixed(2)}
                      </p>
                    )}
                    {indicator.symbol === 'VIX' && (
                      <Badge className={`text-xs ${indicator.status === 'low' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'} border-0`}>
                        {indicator.status === 'low' ? '안정' : '불안'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Commodities */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              원자재 & 암호화폐
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commodities.map((commodity) => (
                <div key={commodity.symbol} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      {commodity.symbol === 'BTC' ? (
                        <span className="text-yellow-600 font-bold">₿</span>
                      ) : commodity.symbol === 'GC' ? (
                        <span className="text-yellow-600 font-bold">Au</span>
                      ) : (
                        <span className="text-yellow-600 font-bold">🛢️</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{commodity.name}</p>
                      <p className="text-xs text-slate-500">{commodity.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ${commodity.price.toLocaleString()}
                    </p>
                    <p className={`text-sm flex items-center justify-end gap-1 ${commodity.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {commodity.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {commodity.changePercent >= 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sector Heatmap */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                섹터별 현황
              </CardTitle>
              <CardDescription>평균 점수 기준 섹터 히트맵</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-blue-600">
              <Link href="/screener">
                스크리너에서 보기 <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sectorPerformance.slice(0, 12).map((sector) => {
              const scoreColor = sector.avgScore >= 65 ? 'bg-green-500' :
                sector.avgScore >= 50 ? 'bg-yellow-500' :
                sector.avgScore >= 35 ? 'bg-orange-500' : 'bg-red-500';
              const bgColor = sector.avgScore >= 65 ? 'bg-green-50 border-green-200' :
                sector.avgScore >= 50 ? 'bg-yellow-50 border-yellow-200' :
                sector.avgScore >= 35 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';

              return (
                <div
                  key={sector.sector}
                  className={`p-4 rounded-xl border-2 ${bgColor} hover:shadow-md transition-all cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {sector.sector}
                    </span>
                    <Badge className={`${scoreColor} text-white border-0 text-xs`}>
                      {sector.avgScore.toFixed(0)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{sector.count}개 종목</span>
                    <span className="text-red-500">-{sector.avgDrawdown.toFixed(1)}%</span>
                  </div>
                  <Progress value={sector.avgScore} className="h-1.5 mt-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Picks & Opportunities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* High Score Stocks */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                고점수 종목 TOP 5
              </CardTitle>
              <Badge className="bg-green-100 text-green-700 border-0">품질 우수</Badge>
            </div>
            <CardDescription>종합 점수 70점 이상 종목</CardDescription>
          </CardHeader>
          <CardContent>
            {topScorers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">해당 종목이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {topScorers.map((stock, index) => (
                  <Link
                    key={stock.symbol}
                    href={`/stocks/${stock.symbol}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700 text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                          {stock.symbol}
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">
                          {stock.tickers?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700 border-0 font-bold">
                        {stock.score_total?.toFixed(0)}점
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatCurrency(stock.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drawdown Opportunities */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                급락 기회 종목
              </CardTitle>
              <Badge className="bg-orange-100 text-orange-700 border-0">턴어라운드</Badge>
            </div>
            <CardDescription>고점 대비 20%+ 하락 + 점수 50+</CardDescription>
          </CardHeader>
          <CardContent>
            {drawdownOpportunities.length === 0 ? (
              <p className="text-center text-slate-500 py-8">해당 종목이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {drawdownOpportunities.map((stock, index) => (
                  <Link
                    key={stock.symbol}
                    href={`/stocks/${stock.symbol}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center font-bold text-orange-700 text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                          {stock.symbol}
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">
                          {stock.tickers?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-red-100 text-red-600 border-0 font-bold">
                        -{stock.drawdown?.toFixed(1)}%
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        점수 {stock.score_total?.toFixed(0)}점
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Insight */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">오늘의 시장 인사이트</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {fearGreedScore >= 60
                  ? `현재 시장 심리는 탐욕 구간(${fearGreedScore})입니다. VIX가 ${vix.toFixed(1)}로 낮아 변동성이 안정적이지만, 과열 신호일 수 있으니 신규 진입 시 분할 매수를 권장합니다.`
                  : fearGreedScore >= 40
                  ? `현재 시장 심리는 중립 구간(${fearGreedScore})입니다. 특별한 방향성 없이 종목별 선별이 중요한 시기입니다. 펀더멘털이 좋은 종목 위주로 접근하세요.`
                  : `현재 시장 심리는 공포 구간(${fearGreedScore})입니다. 하락장에서는 고점수 종목의 분할 매수 기회가 될 수 있습니다. 단, 충분한 현금 비중을 유지하세요.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
