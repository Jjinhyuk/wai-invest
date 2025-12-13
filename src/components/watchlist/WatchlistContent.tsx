'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Trash2, TrendingUp, TrendingDown, Search, ArrowUpDown, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatMarketCap, formatPercent } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface WatchlistContentProps {
  watchlistId: string;
  watchlistItems: any[];
}

type SortField = 'symbol' | 'score_total' | 'drawdown' | 'price' | 'market_cap';

export function WatchlistContent({
  watchlistId,
  watchlistItems: initialItems,
}: WatchlistContentProps) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortAsc, setSortAsc] = useState(true);

  const supabase = createClient();

  // Enrich with calculated fields
  const enrichedItems = items
    .filter((item) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        item.symbol.toLowerCase().includes(searchLower) ||
        item.tickers?.name?.toLowerCase().includes(searchLower)
      );
    })
    .map((item) => ({
      ...item,
      price: item.metrics_latest?.price || 0,
      score_total: item.metrics_latest?.score_total || 0,
      market_cap: item.metrics_latest?.market_cap || 0,
      drawdown: item.metrics_latest?.week52_high && item.metrics_latest?.price
        ? ((item.metrics_latest.week52_high - item.metrics_latest.price) / item.metrics_latest.week52_high) * 100
        : 0,
    }))
    .sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'symbol');
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('symbol', symbol);

    setItems(items.filter((item) => item.symbol !== symbol));
  };

  const getScoreStyle = (score: number | null) => {
    if (!score) return { bg: 'bg-slate-100', text: 'text-slate-600' };
    if (score >= 70) return { bg: 'bg-green-100', text: 'text-green-700' };
    if (score >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    return { bg: 'bg-red-100', text: 'text-red-700' };
  };

  // Calculate summary stats
  const avgScore = enrichedItems.length > 0
    ? enrichedItems.reduce((sum, item) => sum + item.score_total, 0) / enrichedItems.length
    : 0;

  const avgDrawdown = enrichedItems.length > 0
    ? enrichedItems.reduce((sum, item) => sum + item.drawdown, 0) / enrichedItems.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">관심 종목</h1>
          <p className="text-slate-500 mt-1">
            총 <span className="font-semibold text-slate-700">{items.length}</span>개 종목을 추적 중입니다
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/screener">
            <Plus className="h-4 w-4 mr-2" />
            종목 추가
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-400 to-yellow-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">관심 종목 수</p>
                <p className="text-3xl font-bold mt-2">{items.length}개</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Star className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">평균 점수</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{avgScore.toFixed(0)}점</p>
                <p className="text-sm text-slate-400 mt-1">관심 종목 평균</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">평균 하락률</p>
                <p className="text-3xl font-bold text-red-500 mt-2">-{avgDrawdown.toFixed(1)}%</p>
                <p className="text-sm text-slate-400 mt-1">52주 고점 대비</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                <TrendingDown className="h-7 w-7 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="관심 종목 검색..."
          className="pl-11 h-12 bg-white border-slate-200 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Watchlist table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-lg">관심 종목 목록</CardTitle>
          <CardDescription>스크리너에서 별표를 클릭하여 종목을 추가할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {enrichedItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-10 w-10 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                관심 종목이 없습니다
              </h3>
              <p className="text-slate-500 mb-4 max-w-sm mx-auto">
                스크리너에서 마음에 드는 종목을 찾아 별표를 클릭하면 여기에 추가됩니다.
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/screener">
                  <Search className="h-4 w-4 mr-2" />
                  스크리너에서 종목 찾기
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-600">
                      <button
                        onClick={() => toggleSort('symbol')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        종목 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600">
                      <button
                        onClick={() => toggleSort('score_total')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        점수 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600">
                      <button
                        onClick={() => toggleSort('price')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        현재가 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600">
                      <button
                        onClick={() => toggleSort('drawdown')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        고점 대비 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600">
                      <button
                        onClick={() => toggleSort('market_cap')}
                        className="flex items-center gap-1 hover:text-slate-900"
                      >
                        시가총액 <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-600">섹터</th>
                    <th className="py-4 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedItems.map((item, index) => {
                    const scoreStyle = getScoreStyle(item.score_total);
                    return (
                      <tr
                        key={item.symbol}
                        className={`border-b border-slate-50 hover:bg-blue-50/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <Link
                            href={`/stocks/${item.symbol}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                                {item.symbol}
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              <p className="text-xs text-slate-500 truncate max-w-[150px]">
                                {item.tickers?.name}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${scoreStyle.bg} ${scoreStyle.text} border-0 font-semibold`}>
                            {item.score_total?.toFixed(0) || '-'}점
                          </Badge>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-4 px-4">
                          {item.drawdown > 0 ? (
                            <span className="text-red-500 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              -{item.drawdown.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          {formatMarketCap(item.market_cap)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="bg-slate-50">
                            {item.tickers?.sector || '-'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-500"
                            onClick={() => removeFromWatchlist(item.symbol)}
                          >
                            <Trash2 className="h-4 w-4" />
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
