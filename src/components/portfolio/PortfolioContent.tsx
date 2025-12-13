'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, FileSpreadsheet, Trash2, LayoutGrid, List, TrendingUp, TrendingDown, DollarSign, PieChart, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

interface PortfolioContentProps {
  holdings: any[];
  userId: string;
}

interface ParsedHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  valid: boolean;
  error?: string;
}

export function PortfolioContent({ holdings: initialHoldings, userId }: PortfolioContentProps) {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showUpload, setShowUpload] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedHolding[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Calculate portfolio metrics
  const portfolioStats = holdings.reduce(
    (acc, h) => {
      const price = h.metrics_latest?.price || 0;
      const value = h.quantity * price;
      const cost = h.quantity * h.avg_price;
      acc.totalValue += value;
      acc.totalCost += cost;
      return acc;
    },
    { totalValue: 0, totalCost: 0 }
  );

  const totalGainLoss = portfolioStats.totalValue - portfolioStats.totalCost;
  const totalGainLossPercent =
    portfolioStats.totalCost > 0 ? (totalGainLoss / portfolioStats.totalCost) * 100 : 0;

  // Calculate individual holding metrics
  const enrichedHoldings = holdings
    .map((h) => {
      const price = h.metrics_latest?.price || 0;
      const value = h.quantity * price;
      const cost = h.quantity * h.avg_price;
      const gainLoss = value - cost;
      const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
      const weight = portfolioStats.totalValue > 0 ? (value / portfolioStats.totalValue) * 100 : 0;

      return {
        ...h,
        currentPrice: price,
        currentValue: value,
        cost,
        gainLoss,
        gainLossPercent,
        weight,
      };
    })
    .sort((a, b) => b.currentValue - a.currentValue);

  // Sector breakdown
  const sectorBreakdown = enrichedHoldings.reduce((acc: Record<string, number>, h) => {
    const sector = h.tickers?.sector || '기타';
    acc[sector] = (acc[sector] || 0) + h.currentValue;
    return acc;
  }, {});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsed: ParsedHolding[] = json.map((row: any) => {
          const symbol = (row.Symbol || row.symbol || row.SYMBOL || '').toUpperCase().trim();
          const quantity = parseFloat(row.Quantity || row.quantity || row.QUANTITY || row.Shares || row.shares || 0);
          const avgPrice = parseFloat(row['Avg Price'] || row.avg_price || row.Price || row.price || row['Average Price'] || 0);

          const valid = symbol.length > 0 && !isNaN(quantity) && quantity > 0 && !isNaN(avgPrice) && avgPrice > 0;

          return {
            symbol,
            quantity,
            avgPrice,
            valid,
            error: valid ? undefined : '데이터 오류',
          };
        });

        setParsedData(parsed);
        setShowUpload(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('파일 형식을 확인해주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmUpload = async () => {
    setIsUploading(true);
    try {
      const validHoldings = parsedData.filter((p) => p.valid);

      for (const h of validHoldings) {
        const { data: ticker } = await supabase
          .from('tickers')
          .select('symbol')
          .eq('symbol', h.symbol)
          .single();

        if (!ticker) continue;

        await supabase
          .from('holdings')
          .upsert(
            {
              user_id: userId,
              symbol: h.symbol,
              quantity: h.quantity,
              avg_price: h.avgPrice,
            },
            { onConflict: 'user_id,symbol' }
          );
      }

      const { data: newHoldings } = await supabase
        .from('holdings')
        .select('*, tickers(*), metrics_latest(*)')
        .eq('user_id', userId);

      setHoldings(newHoldings || []);
      setParsedData([]);
      setShowUpload(false);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteHolding = async (id: string) => {
    await supabase.from('holdings').delete().eq('id', id);
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">포트폴리오</h1>
          <p className="text-slate-500 mt-1">보유 종목을 관리하고 수익률을 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            파일 업로드
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload preview modal */}
      {showUpload && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              가져오기 미리보기
            </CardTitle>
            <CardDescription>
              {parsedData.filter((p) => p.valid).length}개 / {parsedData.length}개 항목 유효
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto mb-4 bg-white rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">심볼</th>
                    <th className="text-left p-3 font-semibold">수량</th>
                    <th className="text-left p-3 font-semibold">평균 단가</th>
                    <th className="text-left p-3 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 font-medium">{row.symbol}</td>
                      <td className="p-3">{row.quantity}</td>
                      <td className="p-3">{formatCurrency(row.avgPrice)}</td>
                      <td className="p-3">
                        <Badge className={row.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {row.valid ? '유효' : row.error}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmUpload} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
                {isUploading ? '가져오는 중...' : '가져오기 확인'}
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">총 평가금액</p>
                <p className="text-3xl font-bold mt-2">{formatLargeNumber(portfolioStats.totalValue)}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wallet className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">총 투자금액</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{formatLargeNumber(portfolioStats.totalCost)}</p>
              </div>
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <DollarSign className="h-7 w-7 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">총 수익/손실</p>
                <p className={`text-3xl font-bold mt-2 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatLargeNumber(totalGainLoss)}
                </p>
                <p className={`text-sm mt-1 flex items-center gap-1 ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalGainLoss >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {formatPercent(totalGainLossPercent)}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {totalGainLoss >= 0 ? (
                  <TrendingUp className="h-7 w-7 text-green-600" />
                ) : (
                  <TrendingDown className="h-7 w-7 text-red-500" />
                )}
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
                <p className="text-sm text-slate-400 mt-1">종목 보유 중</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <PieChart className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Holdings list */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl">보유 종목</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {enrichedHoldings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-2">아직 보유 종목이 없습니다</p>
                  <p className="text-sm text-slate-400">CSV 또는 Excel 파일을 업로드해주세요</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {enrichedHoldings.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700">
                          {h.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <Link href={`/stocks/${h.symbol}`} className="font-semibold text-slate-900 hover:text-blue-600">
                            {h.symbol}
                          </Link>
                          <p className="text-sm text-slate-500">
                            {h.quantity}주 × {formatCurrency(h.avg_price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatLargeNumber(h.currentValue)}</p>
                          <p className={`text-sm flex items-center justify-end gap-1 ${h.gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {h.gainLoss >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {formatPercent(h.gainLossPercent)}
                          </p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700 font-medium">
                          {h.weight.toFixed(1)}%
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 hover:bg-red-50 hover:text-red-500"
                          onClick={() => deleteHolding(h.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sector breakdown */}
        <div>
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl">섹터별 비중</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {Object.entries(sectorBreakdown).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">데이터 없음</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(sectorBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([sector, value]) => {
                      const percent = (value / portfolioStats.totalValue) * 100;
                      return (
                        <div key={sector} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{sector}</span>
                            <span className="text-slate-500">{percent.toFixed(1)}%</span>
                          </div>
                          <Progress value={percent} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
