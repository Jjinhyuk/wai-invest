'use client';

import { useState } from 'react';
import { ArrowLeft, Star, StarOff, Bell, Plus, Minus, TrendingUp, TrendingDown, Building2, BarChart3, Shield, Wallet, ChevronRight } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Back button */}
      <Button variant="ghost" asChild className="gap-2 text-slate-600 hover:text-slate-900 -ml-2">
        <Link href="/screener">
          <ArrowLeft className="h-4 w-4" />
          스크리너로 돌아가기
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {ticker.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{ticker.symbol}</h1>
              <Badge className="bg-slate-100 text-slate-700 border-0">{ticker.sector || '섹터 미분류'}</Badge>
            </div>
            <p className="text-lg text-slate-500 mt-1">{ticker.name}</p>
            {metrics?.as_of && (
              <p className="text-sm text-slate-400 mt-1">
                데이터 기준일: {formatDate(metrics.as_of)}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={toggleWatchlist}
            className={`rounded-xl border-2 ${isInWatchlist ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' : 'border-slate-200'}`}
          >
            {isInWatchlist ? (
              <>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-2" />
                관심 종목 등록됨
              </>
            ) : (
              <>
                <StarOff className="h-4 w-4 mr-2" />
                관심 종목 추가
              </>
            )}
          </Button>
          <Button variant="outline" className="rounded-xl border-slate-200">
            <Bell className="h-4 w-4 mr-2" />
            알림 설정
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary card */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                종목 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium">현재가</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(metrics?.price)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600 font-medium">시가총액</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{formatMarketCap(metrics?.market_cap)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm text-red-600 font-medium">52주 고점 대비</p>
                  <p className={`text-xl font-bold mt-1 ${drawdown && drawdown > 20 ? 'text-red-600' : 'text-slate-900'}`}>
                    {drawdown ? `-${drawdown.toFixed(1)}%` : '-'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600 font-medium">종합 점수</p>
                  <p className={`text-xl font-bold mt-1 ${getScoreColor(metrics?.score_total)}`}>
                    {metrics?.score_total?.toFixed(0) || '-'}점
                  </p>
                </div>
              </div>

              {/* 52-week position */}
              {position52w !== null && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm font-semibold text-slate-700 mb-3">52주 가격 범위</p>
                  <div className="flex justify-between text-sm mb-2 text-slate-500">
                    <span>최저: {formatCurrency(metrics?.week52_low)}</span>
                    <span>최고: {formatCurrency(metrics?.week52_high)}</span>
                  </div>
                  <div className="relative">
                    <Progress value={position52w} className="h-3" />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"
                      style={{ left: `${position52w}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    현재 가격은 52주 범위의 {position52w.toFixed(0)}% 위치에 있습니다
                  </p>
                </div>
              )}

              {/* Explain text */}
              {metrics?.explain_text && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-800">{metrics.explain_text}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed metrics tabs */}
          <Tabs defaultValue="metrics" className="space-y-4">
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="metrics" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                핵심 지표
              </TabsTrigger>
              <TabsTrigger value="scores" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                점수 분석
              </TabsTrigger>
              <TabsTrigger value="risk" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                리스크 요인
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metrics">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                    <MetricRow
                      label="P/E 비율"
                      value={metrics?.pe?.toFixed(2)}
                      tooltip="주가수익비율. 주가 ÷ 주당순이익. 낮을수록 저평가, 보통 15~25가 적정"
                    />
                    <MetricRow
                      label="P/S 비율"
                      value={metrics?.ps?.toFixed(2)}
                      tooltip="주가매출비율. 주가 ÷ 주당매출. 성장주 평가에 유용, 보통 2 이하가 양호"
                    />
                    <MetricRow
                      label="P/B 비율"
                      value={metrics?.pb?.toFixed(2)}
                      tooltip="주가순자산비율. 주가 ÷ 주당순자산. 1 미만이면 자산가치 대비 저평가"
                    />
                    <MetricRow
                      label="PEG 비율"
                      value={metrics?.peg?.toFixed(2)}
                      tooltip="주가수익성장비율. P/E ÷ 성장률. 1 미만이면 저평가, 1.5 이하가 양호"
                      highlight={metrics?.peg != null && metrics.peg <= 1.5}
                    />
                    <MetricRow
                      label="ROE"
                      value={metrics?.roe ? formatPercent(metrics.roe * 100) : '-'}
                      tooltip="자기자본수익률. 순이익 ÷ 자기자본. 15% 이상이면 우수, 높을수록 효율적 경영"
                      highlight={metrics?.roe != null && metrics.roe >= 0.15}
                    />
                    <MetricRow
                      label="ROIC"
                      value={metrics?.roic ? formatPercent(metrics.roic * 100) : '-'}
                      tooltip="투자자본수익률. 영업이익 ÷ 투자자본. 10% 이상이면 양호, 워런 버핏이 중시하는 지표"
                      highlight={metrics?.roic != null && metrics.roic >= 0.1}
                    />
                    <MetricRow
                      label="매출총이익률"
                      value={metrics?.gross_margin ? formatPercent(metrics.gross_margin * 100) : '-'}
                      tooltip="(매출 - 매출원가) ÷ 매출. 40% 이상이면 경쟁력 있는 사업 모델"
                    />
                    <MetricRow
                      label="영업이익률"
                      value={metrics?.operating_margin ? formatPercent(metrics.operating_margin * 100) : '-'}
                      tooltip="영업이익 ÷ 매출. 15% 이상이면 양호, 사업의 수익성을 나타냄"
                    />
                    <MetricRow
                      label="순이익률"
                      value={metrics?.net_margin ? formatPercent(metrics.net_margin * 100) : '-'}
                      tooltip="순이익 ÷ 매출. 10% 이상이면 양호, 최종적인 수익성 지표"
                    />
                    <MetricRow
                      label="매출 성장률"
                      value={metrics?.revenue_growth_yoy ? formatPercent(metrics.revenue_growth_yoy * 100) : '-'}
                      tooltip="전년 대비 매출 증가율. 10% 이상이면 성장주, 20% 이상이면 고성장"
                      highlight={metrics?.revenue_growth_yoy != null && metrics.revenue_growth_yoy >= 0.1}
                    />
                    <MetricRow
                      label="EPS 성장률"
                      value={metrics?.eps_growth_yoy ? formatPercent(metrics.eps_growth_yoy * 100) : '-'}
                      tooltip="전년 대비 주당순이익 증가율. 꾸준한 EPS 성장은 주가 상승의 핵심 동력"
                    />
                    <MetricRow
                      label="배당 수익률"
                      value={metrics?.dividend_yield ? formatPercent(metrics.dividend_yield * 100) : '-'}
                      tooltip="연간 배당금 ÷ 주가. 2~4%가 적정, 너무 높으면 배당 지속성 확인 필요"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scores">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6 space-y-4">
                  <ScoreBar label="퀄리티 (40%)" score={metrics?.score_quality} />
                  <ScoreBar label="성장성 (30%)" score={metrics?.score_growth} />
                  <ScoreBar label="가치 (20%)" score={metrics?.score_value} />
                  <ScoreBar label="리스크 (10%)" score={metrics?.score_risk} />
                  <Separator />
                  <ScoreBar label="종합 점수" score={metrics?.score_total} isTotal />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <RiskItem
                      label="베타"
                      value={metrics?.beta?.toFixed(2) || '-'}
                      status={metrics?.beta && metrics.beta > 1.5 ? 'warning' : 'ok'}
                      description="S&P 500 대비 시장 변동성"
                    />
                    <RiskItem
                      label="부채비율 (D/E)"
                      value={metrics?.debt_to_equity?.toFixed(2) || '-'}
                      status={metrics?.debt_to_equity && metrics.debt_to_equity > 1 ? 'warning' : 'ok'}
                      description="재무 레버리지 비율"
                    />
                    <RiskItem
                      label="유동비율"
                      value={metrics?.current_ratio?.toFixed(2) || '-'}
                      status={metrics?.current_ratio && metrics.current_ratio < 1 ? 'warning' : 'ok'}
                      description="단기 유동성 지표"
                    />
                    <RiskItem
                      label="FCF (잉여현금흐름)"
                      value={metrics?.fcf ? (metrics.fcf > 0 ? '양수' : '음수') : '-'}
                      status={metrics?.fcf && metrics.fcf < 0 ? 'warning' : 'ok'}
                      description="잉여현금흐름 상태"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - My Actions */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                내 포지션
              </CardTitle>
              <CardDescription>
                {holding ? '보유 정보를 수정하세요' : '이 종목을 포트폴리오에 추가하세요'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {holding && holdingValue && (
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">평가금액</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(holdingValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">수익/손실</span>
                    <span className={`font-semibold flex items-center gap-1 ${holdingGainLoss && holdingGainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {holdingGainLoss && holdingGainLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {formatCurrency(holdingGainLoss)} ({formatPercent(holdingGainLossPercent)})
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">보유 수량</label>
                <Input
                  type="number"
                  placeholder="예: 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">평균 매수가</label>
                <Input
                  type="number"
                  placeholder="예: 150.00"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={saveHolding} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11">
                  <Plus className="h-4 w-4 mr-2" />
                  {holding ? '수정하기' : '추가하기'}
                </Button>
                {holding && (
                  <Button variant="outline" size="icon" onClick={removeHolding} className="h-11 w-11 border-red-200 text-red-500 hover:bg-red-50">
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

function MetricRow({
  label,
  value,
  tooltip,
  highlight
}: {
  label: string;
  value: string | undefined;
  tooltip?: string;
  highlight?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <div
        className="relative flex items-center gap-1"
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-sm text-slate-500">{label}</span>
        {tooltip && (
          <>
            <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-slate-400 hover:text-slate-600 cursor-help rounded-full border border-slate-300 hover:border-slate-400 transition-colors">
              ?
            </span>
            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-50 w-64 leading-relaxed">
                {tooltip}
                <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800" />
              </div>
            )}
          </>
        )}
      </div>
      <span className={`font-semibold ${highlight ? 'text-green-600' : 'text-slate-900'}`}>
        {value || '-'}
        {highlight && <span className="ml-1 text-green-500">✓</span>}
      </span>
    </div>
  );
}

function ScoreBar({ label, score, isTotal }: { label: string; score: number | null | undefined; isTotal?: boolean }) {
  const getColor = () => {
    if (!score) return 'bg-slate-200';
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (!score) return 'text-slate-400';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-2 ${isTotal ? 'pt-2' : ''}`}>
      <div className="flex justify-between text-sm">
        <span className={`${isTotal ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{label}</span>
        <span className={`${isTotal ? 'font-bold text-lg' : 'font-semibold'} ${getTextColor()}`}>
          {score?.toFixed(0) || '-'}점
        </span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getColor()}`}
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
    <div className={`flex items-center justify-between p-4 rounded-xl ${status === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
          {value}
        </p>
        <Badge className={`text-xs ${status === 'warning' ? 'bg-yellow-100 text-yellow-700 border-0' : 'bg-green-100 text-green-700 border-0'}`}>
          {status === 'warning' ? '주의' : '양호'}
        </Badge>
      </div>
    </div>
  );
}
