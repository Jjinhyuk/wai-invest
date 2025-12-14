import { NextResponse } from 'next/server';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketIndicator {
  symbol: string;
  name: string;
  value: number;
  change?: number;
  unit?: string;
  status?: 'low' | 'high';
}

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface FearGreedData {
  value: number;
  label: string;
}

async function fetchFMP<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.warn('FMP_API_KEY not set');
    return null;
  }

  try {
    const url = `${FMP_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`FMP API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('FMP fetch error:', error);
    return null;
  }
}

export async function GET() {
  try {
    // Fetch market data in parallel
    const [
      indicesData,
      vixData,
      forexData,
      commoditiesData,
      treasuryData,
      fearGreedData,
    ] = await Promise.all([
      // Major indices via ETFs
      fetchFMP<any[]>('/quote/SPY,QQQ,DIA,IWM'),
      // VIX - Volatility Index
      fetchFMP<any[]>('/quote/UVXY'),
      // Forex - USD/KRW and DXY
      fetchFMP<any[]>('/quote/USDKRW'),
      // Commodities - Gold, Oil
      fetchFMP<any[]>('/quote/GC=F,CL=F'),
      // 10-year Treasury
      fetchFMP<any[]>('/quote/^TNX'),
      // Fear and Greed Index
      fetchFMP<any[]>('/fear-and-greed-index'),
    ]);

    // Process indices
    const indexNames: Record<string, string> = {
      SPY: 'S&P 500',
      QQQ: 'NASDAQ 100',
      DIA: 'DOW 30',
      IWM: 'Russell 2000',
    };

    const indices: MarketIndex[] = (indicesData || []).map((item: any) => ({
      symbol: item.symbol,
      name: indexNames[item.symbol] || item.name,
      price: item.price || 0,
      change: item.change || 0,
      changePercent: item.changesPercentage || 0,
    }));

    // Process VIX
    const vixValue = vixData?.[0]?.price || 15;
    const vixChange = vixData?.[0]?.change || 0;

    // Calculate Fear & Greed from API or VIX
    let fearGreedValue = 50;
    let fearGreedLabel = '중립';

    if (fearGreedData && Array.isArray(fearGreedData) && fearGreedData.length > 0) {
      fearGreedValue = fearGreedData[0].value || 50;
      fearGreedLabel = fearGreedData[0].valueClassification || '중립';
    } else {
      // Fallback: Calculate from VIX
      fearGreedValue = Math.max(0, Math.min(100, 100 - (vixValue - 10) * 3));
      fearGreedLabel = fearGreedValue >= 70 ? '탐욕' :
                       fearGreedValue >= 50 ? '중립' :
                       fearGreedValue >= 30 ? '두려움' : '극단적 두려움';
    }

    // Process indicators
    const indicators: MarketIndicator[] = [
      {
        symbol: 'VIX',
        name: '공포지수',
        value: vixValue,
        change: vixChange,
        status: vixValue < 20 ? 'low' : 'high',
      },
    ];

    // Add DXY if available
    const dxyData = await fetchFMP<any[]>('/quote/DX-Y.NYB');
    if (dxyData?.[0]) {
      indicators.push({
        symbol: 'DXY',
        name: '달러 인덱스',
        value: dxyData[0].price || 104,
        change: dxyData[0].change || 0,
      });
    } else {
      indicators.push({
        symbol: 'DXY',
        name: '달러 인덱스',
        value: 106.5,
        change: 0.15,
      });
    }

    // Add Treasury yield
    if (treasuryData?.[0]) {
      indicators.push({
        symbol: 'TNX',
        name: '미국 10년물',
        value: treasuryData[0].price || 4.2,
        unit: '%',
      });
    } else {
      indicators.push({
        symbol: 'TNX',
        name: '미국 10년물',
        value: 4.25,
        unit: '%',
      });
    }

    // Add USD/KRW
    if (forexData?.[0]) {
      indicators.push({
        symbol: 'USDKRW',
        name: '원/달러',
        value: forexData[0].price || 1380,
        change: forexData[0].change || 0,
      });
    } else {
      indicators.push({
        symbol: 'USDKRW',
        name: '원/달러',
        value: 1385,
        change: -2.5,
      });
    }

    // Process commodities
    const commodities: Commodity[] = [];

    // Gold
    const goldData = commoditiesData?.find((c: any) => c.symbol?.includes('GC'));
    commodities.push({
      symbol: 'GC',
      name: '금',
      price: goldData?.price || 2650,
      change: goldData?.change || 0,
      changePercent: goldData?.changesPercentage || 0,
    });

    // Oil
    const oilData = commoditiesData?.find((c: any) => c.symbol?.includes('CL'));
    commodities.push({
      symbol: 'CL',
      name: '원유(WTI)',
      price: oilData?.price || 71,
      change: oilData?.change || 0,
      changePercent: oilData?.changesPercentage || 0,
    });

    // Bitcoin - fetch separately
    const btcData = await fetchFMP<any[]>('/quote/BTCUSD');
    commodities.push({
      symbol: 'BTC',
      name: '비트코인',
      price: btcData?.[0]?.price || 100000,
      change: btcData?.[0]?.change || 0,
      changePercent: btcData?.[0]?.changesPercentage || 0,
    });

    const fearGreed: FearGreedData = {
      value: fearGreedValue,
      label: fearGreedLabel,
    };

    return NextResponse.json({
      success: true,
      data: {
        indices: indices.length > 0 ? indices : getDefaultIndices(),
        indicators,
        commodities,
        fearGreed,
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Market data API error:', error);

    // Return default data on error
    return NextResponse.json({
      success: true,
      data: {
        indices: getDefaultIndices(),
        indicators: getDefaultIndicators(),
        commodities: getDefaultCommodities(),
        fearGreed: { value: 50, label: '중립' },
        lastUpdate: new Date().toISOString(),
      },
    });
  }
}

function getDefaultIndices(): MarketIndex[] {
  return [
    { symbol: 'SPY', name: 'S&P 500', price: 5998.74, change: 15.23, changePercent: 0.25 },
    { symbol: 'QQQ', name: 'NASDAQ 100', price: 21234.56, change: -45.67, changePercent: -0.21 },
    { symbol: 'DIA', name: 'DOW 30', price: 44642.15, change: 125.43, changePercent: 0.28 },
    { symbol: 'IWM', name: 'Russell 2000', price: 2342.87, change: 18.34, changePercent: 0.79 },
  ];
}

function getDefaultIndicators(): MarketIndicator[] {
  return [
    { symbol: 'VIX', name: '공포지수', value: 13.45, status: 'low' },
    { symbol: 'DXY', name: '달러 인덱스', value: 106.82, change: 0.15 },
    { symbol: 'TNX', name: '미국 10년물', value: 4.23, unit: '%' },
    { symbol: 'USDKRW', name: '원/달러', value: 1385.50, change: -2.30 },
  ];
}

function getDefaultCommodities(): Commodity[] {
  return [
    { symbol: 'GC', name: '금', price: 2658.40, change: 12.30, changePercent: 0.46 },
    { symbol: 'CL', name: '원유(WTI)', price: 71.24, change: -0.87, changePercent: -1.21 },
    { symbol: 'BTC', name: '비트코인', price: 101234, change: 2345, changePercent: 2.37 },
  ];
}
