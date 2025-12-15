'use client';

import { useState } from 'react';
import {
  Search,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Minus,
  Loader2,
  Sparkles,
  DollarSign,
  Shield,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, formatMarketCap } from '@/lib/utils';

interface Ticker {
  symbol: string;
  name: string;
  sector: string | null;
}

interface AIAnalysis {
  opinion: '매수' | '관망' | '매도';
  confidence: number;
  fairValueLow: number;
  fairValueHigh: number;
  currentVsValue: '저평가' | '적정' | '고평가';
  holdingPeriod: string;
  investorType: string;
  summary: string;
  investmentPoints: string[];
  risks: string[];
  conclusion: string;
}

interface AnalysisResult {
  analysis: AIAnalysis;
  ticker: {
    symbol: string;
    name: string;
    sector: string | null;
    industry: string | null;
  };
  metrics: {
    price: number | null;
    market_cap: number | null;
    pe: number | null;
    roe: number | null;
    revenue_growth_yoy: number | null;
    week52_high: number | null;
    week52_low: number | null;
    score_total: number | null;
  } | null;
  isDemo: boolean;
  analyzedAt?: string;
}

interface AIAnalysisContentProps {
  tickers: Ticker[];
}

export function AIAnalysisContent({ tickers }: AIAnalysisContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredTickers = searchQuery.length > 0
    ? tickers.filter(
        t =>
          t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleAnalyze = async (symbol: string) => {
    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);
    setSearchQuery(symbol);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI 분석 요청 실패');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleAnalyze(searchQuery.trim().toUpperCase());
    }
  };

  const getOpinionColor = (opinion: string) => {
    switch (opinion) {
      case '매수':
        return 'bg-green-100 text-green-700 border-green-200';
      case '매도':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getOpinionIcon = (opinion: string) => {
    switch (opinion) {
      case '매수':
        return <TrendingUp className="h-5 w-5" />;
      case '매도':
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Minus className="h-5 w-5" />;
    }
  };

  const getValueColor = (value: string) => {
    switch (value) {
      case '저평가':
        return 'text-green-600';
      case '고평가':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Brain className="h-7 w-7 text-purple-600" />
          AI 종목 분석
        </h1>
        <p className="text-muted-foreground mt-1">
          AI가 재무 데이터를 분석하여 투자 의견과 적정가치를 제공합니다
        </p>
      </div>

      {/* Search Box */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="종목 심볼 또는 이름 검색 (예: AAPL, Apple)"
                  className="pl-12 h-14 text-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {/* Autocomplete Suggestions */}
                {showSuggestions && filteredTickers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-80 overflow-y-auto">
                    {filteredTickers.map((ticker) => (
                      <button
                        key={ticker.symbol}
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                        onClick={() => handleAnalyze(ticker.symbol)}
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {ticker.symbol}
                          </span>
                          <span className="text-slate-500 ml-2">{ticker.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ticker.sector || '미분류'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="h-14 px-8 bg-purple-600 hover:bg-purple-700 rounded-xl text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    AI 분석
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Demo Notice */}
      {result?.isDemo && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">데모 모드</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                ANTHROPIC_API_KEY를 환경변수에 추가하면 실제 AI 분석을 받을 수 있습니다
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {result && (
        <div className="space-y-6">
          {/* Main Opinion Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className={`p-6 ${
              result.analysis.opinion === '매수'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : result.analysis.opinion === '매도'
                ? 'bg-gradient-to-r from-red-500 to-rose-600'
                : 'bg-gradient-to-r from-yellow-500 to-amber-600'
            } text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      {getOpinionIcon(result.analysis.opinion)}
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">AI 투자 의견</p>
                      <h2 className="text-3xl font-bold">{result.analysis.opinion}</h2>
                    </div>
                  </div>
                  <p className="text-white/90 mt-3">{result.analysis.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">확신도</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-3 h-3 rounded-full ${
                          n <= result.analysis.confidence ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {result.ticker.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {result.ticker.symbol}
                  </h3>
                  <p className="text-slate-500">{result.ticker.name}</p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {result.ticker.sector || '미분류'}
                </Badge>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <DollarSign className="h-4 w-4" />
                    현재가
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(result.metrics?.price)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
                    <Target className="h-4 w-4" />
                    적정가치
                  </div>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-400">
                    ${result.analysis.fairValueLow.toFixed(0)} ~ ${result.analysis.fairValueHigh.toFixed(0)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <BarChart3 className="h-4 w-4" />
                    밸류에이션
                  </div>
                  <p className={`text-xl font-bold ${getValueColor(result.analysis.currentVsValue)}`}>
                    {result.analysis.currentVsValue}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Clock className="h-4 w-4" />
                    추천 보유기간
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {result.analysis.holdingPeriod}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Points & Risks */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Investment Points */}
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  투자 포인트
                </CardTitle>
                <CardDescription>이 종목의 장점</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="space-y-3">
                  {result.analysis.investmentPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm font-medium">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{point}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Risks */}
            <Card className="border-0 shadow-md">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  리스크 요인
                </CardTitle>
                <CardDescription>투자 시 주의할 점</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="space-y-3">
                  {result.analysis.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 text-sm font-medium">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{risk}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Conclusion */}
          <Card className="border-0 shadow-md bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                종합 의견
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                {result.analysis.conclusion}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  적합: {result.analysis.investorType}
                </div>
                {result.analyzedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    분석일시: {new Date(result.analyzedAt).toLocaleString('ko-KR')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              본 분석은 AI가 생성한 참고 자료이며, 투자 조언이 아닙니다.
              투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isLoading && !error && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              종목을 검색하여 AI 분석을 받아보세요
            </h3>
            <p className="text-slate-500 mb-6">
              AI가 재무 데이터를 분석하여 투자 의견, 적정가치, 리스크를 알려드립니다
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'AMZN'].map((symbol) => (
                <Button
                  key={symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyze(symbol)}
                  className="rounded-full"
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
