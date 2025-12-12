'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Filter, Star, StarOff, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, formatMarketCap, formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ScreenerContentProps {
  stocks: any[];
  totalCount: number;
  watchlistId?: string;
  watchlistSymbols: Set<string>;
}

type SortField = 'score_total' | 'score_quality' | 'score_growth' | 'score_value' | 'drawdown' | 'peg' | 'market_cap';

const presets = [
  { id: 'quality', label: 'Quality Growth', description: 'High ROE, FCF+, consistent growth' },
  { id: 'value', label: 'Value (PEG)', description: 'Low PEG with reasonable quality' },
  { id: 'turnaround', label: 'Turnaround', description: 'High drawdown + quality metrics' },
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

  const getScoreBadgeClass = (score: number | null) => {
    if (!score) return '';
    if (score >= 70) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Stock Screener</h1>
        <p className="text-muted-foreground">
          {totalCount} stocks available
        </p>
      </div>

      {/* Presets */}
      <Tabs value={activePreset} onValueChange={setActivePreset}>
        <TabsList>
          {presets.map((preset) => (
            <TabsTrigger key={preset.id} value={preset.id}>
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {presets.map((preset) => (
          <TabsContent key={preset.id} value={preset.id}>
            <p className="text-sm text-muted-foreground">{preset.description}</p>
          </TabsContent>
        ))}
      </Tabs>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            type="search"
            placeholder="Search by symbol or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Showing {filteredStocks.length} of {totalCount} stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stocks match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm">
                    <th className="pb-3 pr-4 font-medium">Stock</th>
                    <th className="pb-3 px-4 font-medium">
                      <button
                        onClick={() => toggleSort('score_total')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Score <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 px-4 font-medium">Price</th>
                    <th className="pb-3 px-4 font-medium">
                      <button
                        onClick={() => toggleSort('drawdown')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        52w Drawdown <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 px-4 font-medium">
                      <button
                        onClick={() => toggleSort('peg')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        PEG <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 px-4 font-medium">
                      <button
                        onClick={() => toggleSort('market_cap')}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Market Cap <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="pb-3 px-4 font-medium">Explain</th>
                    <th className="pb-3 pl-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock.symbol} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/stocks/${stock.symbol}`}
                          className="block"
                        >
                          <span className="font-semibold hover:underline">
                            {stock.symbol}
                          </span>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {stock.tickers?.name}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={getScoreBadgeClass(stock.score_total)}
                        >
                          {stock.score_total?.toFixed(0) || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(stock.price)}
                      </td>
                      <td className="py-3 px-4">
                        {stock.drawdown !== null ? (
                          <span className="text-red-600">
                            -{stock.drawdown.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {stock.peg?.toFixed(2) || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {formatMarketCap(stock.market_cap)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {stock.explain_text || '-'}
                        </p>
                      </td>
                      <td className="py-3 pl-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWatchlist(stock.symbol)}
                        >
                          {watchlistSymbols.has(stock.symbol) ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
