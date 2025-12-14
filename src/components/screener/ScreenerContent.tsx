'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Filter, Star, StarOff, ArrowUpDown, Search, TrendingDown, ChevronRight, Sparkles, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatMarketCap } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ScreenerContentProps {
  stocks: any[];
  totalCount: number;
  watchlistId?: string;
  watchlistSymbols: Set<string>;
}

type SortField = 'score_total' | 'score_quality' | 'score_growth' | 'score_value' | 'drawdown' | 'peg' | 'market_cap';

const presets = [
  {
    id: 'quality',
    label: '퀄리티 성장',
    description: '높은 수익성과 꾸준한 성장세를 가진 우량 기업',
    icon: Sparkles,
    color: 'bg-blue-500',
    filters: [
      { label: 'ROE', value: '≥ 15%', description: '자기자본수익률 15% 이상' },
      { label: 'FCF', value: '양수', description: '잉여현금흐름 양수' },
      { label: '매출 성장', value: '≥ 10%', description: '연간 매출 성장률 10% 이상' },
      { label: '품질 점수', value: '≥ 70', description: '품질 점수 70점 이상' },
    ],
    sortBy: 'score_quality' as SortField,
  },
  {
    id: 'value',
    label: '가치 투자',
    description: '저평가된 우량 기업을 찾는 워런 버핏 스타일',
    icon: Target,
    color: 'bg-green-500',
    filters: [
      { label: 'PEG', value: '≤ 1.5', description: '주가수익성장비율 1.5 이하 (저평가)' },
      { label: 'P/E', value: '≤ 25', description: '주가수익비율 25 이하' },
      { label: '부채비율', value: '≤ 1.0', description: 'D/E 비율 1 이하' },
      { label: '종합 점수', value: '≥ 50', description: '종합 점수 50점 이상' },
    ],
    sortBy: 'peg' as SortField,
  },
  {
    id: 'turnaround',
    label: '턴어라운드',
    description: '급락했지만 펀더멘털이 좋은 반등 후보',
    icon: Zap,
    color: 'bg-orange-500',
    filters: [
      { label: '52주 하락', value: '≥ 30%', description: '고점 대비 30% 이상 하락' },
      { label: '종합 점수', value: '≥ 60', description: '펀더멘털 점수 60점 이상' },
      { label: 'FCF', value: '양수', description: '잉여현금흐름 양수' },
      { label: '유동비율', value: '≥ 1.0', description: '단기 유동성 양호' },
    ],
    sortBy: 'drawdown' as SortField,
  },
];

export function ScreenerContent({
  stocks,
  totalCount,
  watchlistId,
  watchlistSymbols: initialWatchlistSymbols,
}: ScreenerContentProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('score_total');
  const [sortAsc, setSortAsc] = useState(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState(initialWatchlistSymbols);
  const [activePreset, setActivePreset] = useState('quality');

  const supabase = createClient();

  // Filter and sort stocks
  const filteredStocks = stocks
    .filter((stock) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        stock.symbol.toLowerCase().includes(searchLower) ||
        stock.tickers?.name?.toLowerCase().includes(searchLower)
      );
    })
    .map((stock) => ({
      ...stock,
      drawdown: stock.week52_high
        ? ((stock.week52_high - stock.price) / stock.week52_high) * 100
        : null,
    }))
    .sort((a, b) => {
      let aVal = a[sortField] ?? 0;
      let bVal = b[sortField] ?? 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    if (!watchlistId) return;

    const isInWatchlist = watchlistSymbols.has(symbol);

    if (isInWatchlist) {
      await supabase
        .from('watchlist_items')
        .delete()
        .eq('watchlist_id', watchlistId)
        .eq('symbol', symbol);
      setWatchlistSymbols((prev) => {
        const next = new Set(prev);
        next.delete(symbol);
        return next;
      });
    } else {
      await supabase
        .from('watchlist_items')
        .insert({ watchlist_id: watchlistId, symbol });
      setWatchlistSymbols((prev) => new Set(prev).add(symbol));
    }
  };

  const getScoreStyle = (score: number | null) => {
    if (!score) return { bg: 'bg-slate-100', text: 'text-slate-600' };
    if (score >= 70) return { bg: 'bg-green-100', text: 'text-green-700' };
    if (score >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-red-100', text: 'text-red-700' };
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">스크리너</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          총 <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span>개 종목 분석 가능
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {presets.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                setActivePreset(preset.id);
                setSortField(preset.sortBy);
                setSortAsc(preset.id === 'value'); // PEG는 낮을수록 좋으므로 오름차순
              }}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 ${preset.color} rounded-xl flex items-center justify-center mb-3`}>
                <preset.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className={`font-semibold ${isActive ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                {preset.label}
              </h3>
              <p className={`text-sm mt-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {preset.description}
              </p>
              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active preset filter conditions */}
      {activePreset && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 ${presets.find(p => p.id === activePreset)?.color} rounded-xl flex items-center justify-center shrink-0`}>
                {(() => {
                  const Icon = presets.find(p => p.id === activePreset)?.icon || Sparkles;
                  return <Icon className="w-5 h-5 text-white" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {presets.find(p => p.id === activePreset)?.label} 전략 필터 조건
                  </h4>
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    {filteredStocks.length}개 종목 해당
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.find(p => p.id === activePreset)?.filters.map((filter, idx) => (
                    <div
                      key={idx}
                      className="group relative"
                    >
                      <Badge
                        variant="outline"
                        className="bg-white border-slate-200 text-slate-700 px-3 py-1.5 cursor-help hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <span className="font-medium">{filter.label}</span>
                        <span className="mx-1.5 text-slate-400">|</span>
                        <span className="text-blue-600">{filter.value}</span>
                      </Badge>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {filter.description}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="종목 검색 (심볼 또는 회사명)..."
            className="pl-11 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 h-12 px-5 rounded-xl border-slate-200">
          <Filter className="h-4 w-4" />
          필터 설정
        </Button>
      </div>

      {/* Results */}
      <Card className="border-0 shadow-md overflow-hidden dark:bg-slate-800">
        <CardHeader className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">검색 결과</CardTitle>
              <CardDescription>
                {filteredStocks.length}개 종목 표시 중
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStocks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">종목</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => toggleSort('score_total')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        종합 점수 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">현재가</th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => toggleSort('drawdown')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        고점 대비 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => toggleSort('peg')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        PEG <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => toggleSort('market_cap')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        시가총액 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">분석 요약</th>
                    <th className="py-4 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock, index) => {
                    const scoreStyle = getScoreStyle(stock.score_total);
                    return (
                      <tr
                        key={stock.symbol}
                        className={`border-b border-slate-50 dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/30 dark:bg-slate-700/30'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <Link
                            href={`/stocks/${stock.symbol}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                              {stock.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                                {stock.symbol}
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                {stock.tickers?.name}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${scoreStyle.bg} ${scoreStyle.text} border-0 font-semibold`}>
                            {stock.score_total?.toFixed(0) || '-'}점
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(stock.price)}
                        </td>
                        <td className="py-4 px-4">
                          {stock.drawdown !== null ? (
                            <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              -{stock.drawdown.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                          {stock.peg?.toFixed(2) || '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                          {formatMarketCap(stock.market_cap)}
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                            {stock.explain_text || '분석 데이터 없음'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-yellow-50"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleWatchlist(stock.symbol);
                            }}
                          >
                            {watchlistSymbols.has(stock.symbol) ? (
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-5 w-5 text-slate-400 hover:text-yellow-500" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
