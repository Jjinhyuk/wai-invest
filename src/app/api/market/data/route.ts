import { NextResponse } from 'next/server';
import { marketDataService } from '@/lib/services/marketDataService';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1분마다 재검증

export async function GET() {
  try {
    const marketData = await marketDataService.getMarketData();

    // API 연결 상태 확인
    const hasRealData = marketData.indices.some(idx => idx.price > 0);

    return NextResponse.json({
      success: true,
      connected: hasRealData,
      data: marketData,
    });
  } catch (error) {
    console.error('Market data API error:', error);

    return NextResponse.json({
      success: false,
      connected: false,
      error: 'Failed to fetch market data',
      data: {
        indices: [],
        indicators: [],
        commodities: [],
        fearGreed: { value: 50, label: '중립' },
        lastUpdate: new Date().toISOString(),
        source: 'None',
      },
    }, { status: 500 });
  }
}
