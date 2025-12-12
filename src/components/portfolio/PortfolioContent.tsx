'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, FileSpreadsheet, Trash2, Plus, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
    const sector = h.tickers?.sector || 'Unknown';
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

        // Parse and validate data
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
            error: valid ? undefined : 'Invalid data',
          };
        });

        setParsedData(parsed);
        setShowUpload(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmUpload = async () => {
    setIsUploading(true);
    try {
      const validHoldings = parsedData.filter((p) => p.valid);

      for (const h of validHoldings) {
        // Check if ticker exists
        const { data: ticker } = await supabase
          .from('tickers')
          .select('symbol')
          .eq('symbol', h.symbol)
          .single();

        if (!ticker) {
          console.warn(`Ticker ${h.symbol} not found, skipping`);
          continue;
        }

        // Upsert holding
        const { error } = await supabase
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

        if (error) {
          console.error(`Error adding ${h.symbol}:`, error);
        }
      }

      // Refresh holdings
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage your stock holdings</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV/XLSX
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
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
            <CardDescription>
              Review the data before importing. {parsedData.filter((p) => p.valid).length} of{' '}
              {parsedData.length} rows valid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Symbol</th>
                    <th className="text-left pb-2">Quantity</th>
                    <th className="text-left pb-2">Avg Price</th>
                    <th className="text-left pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{row.symbol}</td>
                      <td className="py-2">{row.quantity}</td>
                      <td className="py-2">{formatCurrency(row.avgPrice)}</td>
                      <td className="py-2">
                        <Badge variant={row.valid ? 'success' : 'destructive'}>
                          {row.valid ? 'Valid' : row.error}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmUpload} disabled={isUploading}>
                {isUploading ? 'Importing...' : 'Confirm Import'}
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(portfolioStats.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeNumber(portfolioStats.totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatLargeNumber(totalGainLoss)}
            </div>
            <p className={`text-sm ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(totalGainLossPercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holdings.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Holdings list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {enrichedHoldings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No holdings yet.</p>
                  <p className="text-sm mt-2">Upload a CSV/XLSX or add stocks manually.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrichedHoldings.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/stocks/${h.symbol}`} className="font-semibold hover:underline">
                            {h.symbol}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            {h.quantity} shares @ {formatCurrency(h.avg_price)}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-1 text-sm">
                          <span>Current: {formatCurrency(h.currentPrice)}</span>
                          <span>Value: {formatLargeNumber(h.currentValue)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${h.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(h.gainLoss)}
                        </p>
                        <p className={`text-sm ${h.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(h.gainLossPercent)}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <Badge variant="outline">{h.weight.toFixed(1)}%</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={() => deleteHolding(h.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sector breakdown */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(sectorBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(sectorBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([sector, value]) => {
                      const percent = (value / portfolioStats.totalValue) * 100;
                      return (
                        <div key={sector} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{sector}</span>
                            <span>{percent.toFixed(1)}%</span>
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
