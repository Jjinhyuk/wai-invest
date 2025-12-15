'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Rocket,
  Gem,
  Coins,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronRight,
  DollarSign,
  Calendar,
  Shield,
  Zap,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  targetBuyPrice: string;
  expectedReturn: string;
  confidence: number;
  reason: string;
  risks: string;
  catalysts: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  holdingPeriod: string;
  stocks: Stock[];
}

interface ETFPick {
  symbol: string;
  name: string;
  category: string;
  reason: string;
  priority: number;
}

interface RecommendationsData {
  isDemo: boolean;
  marketAnalysis: string;
  updatedAt: string;
  categories: Category[];
  etfPicks: ETFPick[];
  disclaimer: string;
  generatedAt?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  rocket: <Rocket className="h-5 w-5" />,
  gem: <Gem className="h-5 w-5" />,
  coins: <Coins className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  growth: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', border: 'border-purple-200' },
  value: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', border: 'border-blue-200' },
  dividend: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', border: 'border-green-200' },
  opportunity: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', border: 'border-orange-200' },
};

export function AIRecommendationsContent() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setHasStarted(true);

    try {
      const response = await fetch('/api/ai/recommendations');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI 추천을 가져오는데 실패했습니다');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial state - show start button
  if (!hasStarted && !data) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-600" />
            AI 추천 종목
          </h1>
          <p className="text-muted-foreground mt-1">
            AI가 분석한 중장기 투자 추천 종목입니다
          </p>
        </div>

        {/* Start Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              AI 종목 추천 받기
            </h3>
            <p className="text-slate-500 mb-2 max-w-md mx-auto">
              AI가 현재 보유 중인 종목 데이터를 분석하여
              <br />
              성장주, 가치주, 배당주, 매수 기회 종목을 추천해드립니다.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              분석에 약 10~30초 정도 소요됩니다
            </p>
            <Button
              onClick={fetchRecommendations}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              추천 시작하기
            </Button>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-purple-50 dark:bg-purple-900/20">
            <CardContent className="p-4 text-center">
              <Rocket className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-700 dark:text-purple-400">성장주</h4>
              <p className="text-xs text-purple-600/70 mt-1">미래의 테슬라/애플</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4 text-center">
              <Gem className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-blue-700 dark:text-blue-400">가치주</h4>
              <p className="text-xs text-blue-600/70 mt-1">저평가 우량주</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4 text-center">
              <Coins className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-green-700 dark:text-green-400">배당주</h4>
              <p className="text-xs text-green-600/70 mt-1">버핏 스타일 장기</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-semibold text-orange-700 dark:text-orange-400">매수 기회</h4>
              <p className="text-xs text-orange-600/70 mt-1">저점 매수 타이밍</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            AI가 추천 종목을 분석 중입니다
          </h3>
          <p className="text-slate-500 mt-1">잠시만 기다려주세요... (약 10~30초)</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-600" />
            AI 추천 종목
          </h1>
        </div>
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="font-semibold text-red-700 dark:text-red-400">{error}</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                관리자 페이지에서 종목 데이터를 먼저 동기화해주세요.
              </p>
            </div>
            <Button onClick={fetchRecommendations} variant="outline" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-600" />
            AI 추천 종목
          </h1>
          <p className="text-muted-foreground mt-1">
            AI가 분석한 중장기 투자 추천 종목입니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>업데이트: {data.updatedAt}</span>
          </div>
          <Button onClick={fetchRecommendations} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      {data.isDemo && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">데모 모드</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                ANTHROPIC_API_KEY를 환경변수에 추가하면 실제 AI 추천을 받을 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Analysis */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">시장 분석</h3>
              <p className="text-slate-300 leading-relaxed">{data.marketAnalysis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue={data.categories[0]?.id || 'growth'} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-auto flex-wrap gap-1">
          {data.categories.map((cat) => {
            const colors = categoryColors[cat.id] || categoryColors.growth;
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className={`rounded-lg data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2`}
              >
                <span className={colors.text}>{iconMap[cat.icon]}</span>
                <span>{cat.name}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {cat.stocks.length}
                </Badge>
              </TabsTrigger>
            );
          })}
          <TabsTrigger
            value="etf"
            className="rounded-lg data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2"
          >
            <PieChart className="h-4 w-4 text-indigo-600" />
            <span>ETF</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {data.etfPicks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Category Content */}
        {data.categories.map((category) => {
          const colors = categoryColors[category.id] || categoryColors.growth;
          return (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              {/* Category Header */}
              <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center ${colors.text}`}>
                    {iconMap[category.icon]}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${colors.text}`}>{category.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    <Clock className="h-3 w-3 mr-1" />
                    {category.holdingPeriod}
                  </Badge>
                </div>
              </div>

              {/* Stocks Grid */}
              {category.stocks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-500">이 카테고리에 추천 종목이 없습니다</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.stocks.map((stock, index) => (
                    <StockCard key={stock.symbol} stock={stock} rank={index + 1} colors={colors} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}

        {/* ETF Content */}
        <TabsContent value="etf" className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-600">ETF 추천</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  장기 자산배분을 위한 ETF 우선순위
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data.etfPicks.map((etf) => (
              <Card key={etf.symbol} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                      #{etf.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                          {etf.symbol}
                        </h4>
                        <Badge variant="outline">{etf.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{etf.name}</p>
                    </div>
                    <Link href={`/stocks/${etf.symbol}`}>
                      <Button variant="ghost" size="sm">
                        상세 <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
                    {etf.reason}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

function StockCard({
  stock,
  rank,
  colors,
}: {
  stock: Stock;
  rank: number;
  colors: { bg: string; text: string; border: string };
}) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} font-bold`}>
              {rank}
            </div>
            <div>
              <CardTitle className="text-lg">{stock.symbol}</CardTitle>
              <CardDescription className="text-xs">{stock.name}</CardDescription>
            </div>
          </div>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`w-2 h-2 rounded-full mx-0.5 ${
                  n <= stock.confidence ? 'bg-green-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">현재가</p>
            <p className="font-bold text-slate-900 dark:text-white">
              ${stock.currentPrice.toFixed(2)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <p className={`text-xs ${colors.text} mb-1`}>매수 적정가</p>
            <p className={`font-bold ${colors.text}`}>{stock.targetBuyPrice}</p>
          </div>
        </div>

        {/* Expected Return */}
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">기대 수익률</span>
          </div>
          <span className="font-bold text-green-600">{stock.expectedReturn}</span>
        </div>

        {/* Reason */}
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {stock.reason}
          </p>
        </div>

        {/* Catalysts & Risks */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">{stock.catalysts}</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">{stock.risks}</p>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/stocks/${stock.symbol}`} className="block">
          <Button variant="outline" className="w-full" size="sm">
            상세 분석 보기
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
