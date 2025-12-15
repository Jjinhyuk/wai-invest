import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

interface StockForAnalysis {
  symbol: string;
  name: string;
  sector: string | null;
  price: number | null;
  pe: number | null;
  peg: number | null;
  roe: number | null;
  revenue_growth_yoy: number | null;
  dividend_yield: number | null;
  score_total: number | null;
  week52_high: number | null;
  week52_low: number | null;
  market_cap: number | null;
}

function buildRecommendationPrompt(stocks: StockForAnalysis[], marketContext: string): string {
  const stocksData = stocks.map(s => {
    const drawdown = s.week52_high && s.price
      ? ((s.week52_high - s.price) / s.week52_high * 100).toFixed(1)
      : 'N/A';
    return `${s.symbol} (${s.name}) | 섹터: ${s.sector || '미분류'} | 가격: $${s.price?.toFixed(2) || 'N/A'} | P/E: ${s.pe?.toFixed(1) || 'N/A'} | PEG: ${s.peg?.toFixed(2) || 'N/A'} | ROE: ${s.roe ? (s.roe * 100).toFixed(1) + '%' : 'N/A'} | 매출성장: ${s.revenue_growth_yoy ? (s.revenue_growth_yoy * 100).toFixed(1) + '%' : 'N/A'} | 배당률: ${s.dividend_yield ? (s.dividend_yield * 100).toFixed(2) + '%' : 'N/A'} | 52주고점대비: -${drawdown}% | 점수: ${s.score_total?.toFixed(0) || 'N/A'}`;
  }).join('\n');

  return `당신은 월스트리트 출신 미국 주식 투자 전문가입니다. 중장기(2~10년) 관점에서 개인 투자자에게 종목을 추천합니다.

## 현재 시장 상황
${marketContext}

## 분석 대상 종목 데이터
${stocksData}

## 추천 요청
위 데이터를 바탕으로 각 카테고리별 최고의 종목 2~3개를 추천해주세요.

다음 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력:

{
  "marketAnalysis": "현재 시장 상황 요약 (2~3문장)",
  "updatedAt": "${new Date().toISOString().split('T')[0]}",
  "categories": [
    {
      "id": "growth",
      "name": "성장주",
      "description": "미래의 테슬라/애플이 될 수 있는 고성장 기업",
      "icon": "rocket",
      "holdingPeriod": "5년+",
      "stocks": [
        {
          "symbol": "종목코드",
          "name": "회사명",
          "currentPrice": 현재가(숫자),
          "targetBuyPrice": "매수적정가 범위 (예: $100~$120)",
          "expectedReturn": "기대수익률 (예: 100~150%)",
          "confidence": 1~5,
          "reason": "추천 이유 (시장/섹터/기업 분석 기반, 2~3문장)",
          "risks": "주요 리스크 (1문장)",
          "catalysts": "상승 촉매 (1문장)"
        }
      ]
    },
    {
      "id": "value",
      "name": "가치주",
      "description": "저평가된 우량 기업, 안정적 수익 기대",
      "icon": "gem",
      "holdingPeriod": "3~5년",
      "stocks": [...]
    },
    {
      "id": "dividend",
      "name": "배당주",
      "description": "버핏 스타일 장기 배당 수익, 복리 효과",
      "icon": "coins",
      "holdingPeriod": "10년+",
      "stocks": [...]
    },
    {
      "id": "opportunity",
      "name": "매수 기회",
      "description": "일시적 하락으로 저점 매수 기회인 종목",
      "icon": "target",
      "holdingPeriod": "2~3년",
      "stocks": [...]
    }
  ],
  "etfPicks": [
    {
      "symbol": "SPY 또는 QQQ 또는 VOO 등",
      "name": "ETF 이름",
      "category": "지수추종/섹터/테마 등",
      "reason": "추천 이유 (1~2문장)",
      "priority": 1~3 (1이 최우선)
    }
  ],
  "disclaimer": "본 추천은 AI 분석 기반 참고 자료이며, 투자 결정은 본인 책임입니다."
}

## 추천 기준
1. **성장주**: 매출성장률 20%+, PEG < 2, 혁신적 비즈니스 모델
2. **가치주**: P/E < 20, ROE > 15%, 안정적 현금흐름, 저평가 상태
3. **배당주**: 배당수익률 2%+, 배당 성장 이력, 안정적 사업
4. **매수기회**: 52주 고점 대비 20%+ 하락, 펀더멘털은 건전

## 중요 지침
- 각 카테고리 최소 2개, 최대 3개 종목 추천
- 구체적인 매수가 범위 제시 (현재가 기준 안전마진 고려)
- 한국어로 작성, 개인 투자자가 이해하기 쉽게
- ETF는 장기 자산배분 관점에서 3개 추천
- 실제 투자에 도움이 되는 실용적인 조언 제공`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // Get stocks with metrics from database
    const { data: stocksWithMetrics } = await supabase
      .from('tickers')
      .select(`
        symbol,
        name,
        sector,
        metrics_latest (
          price,
          pe,
          peg,
          roe,
          revenue_growth_yoy,
          dividend_yield,
          score_total,
          week52_high,
          week52_low,
          market_cap
        )
      `)
      .eq('is_active', true)
      .not('metrics_latest', 'is', null)
      .limit(100);

    if (!stocksWithMetrics || stocksWithMetrics.length === 0) {
      return NextResponse.json({
        error: '분석할 종목 데이터가 없습니다. 관리자 페이지에서 데이터를 동기화해주세요.'
      }, { status: 404 });
    }

    // Transform data
    const stocks: StockForAnalysis[] = stocksWithMetrics.map((s: Record<string, unknown>) => {
      const metrics = s.metrics_latest as Record<string, unknown> | null;
      return {
        symbol: s.symbol as string,
        name: s.name as string,
        sector: s.sector as string | null,
        price: metrics?.price as number | null,
        pe: metrics?.pe as number | null,
        peg: metrics?.peg as number | null,
        roe: metrics?.roe as number | null,
        revenue_growth_yoy: metrics?.revenue_growth_yoy as number | null,
        dividend_yield: metrics?.dividend_yield as number | null,
        score_total: metrics?.score_total as number | null,
        week52_high: metrics?.week52_high as number | null,
        week52_low: metrics?.week52_low as number | null,
        market_cap: metrics?.market_cap as number | null,
      };
    });

    // Market context (simplified - in production would fetch real data)
    const today = new Date();
    const marketContext = `오늘 날짜: ${today.toLocaleDateString('ko-KR')}
현재 시장은 변동성이 있는 상황입니다. 연준의 금리 정책과 인플레이션 동향을 주시해야 합니다.
기술주와 성장주는 금리 민감도가 높으며, 가치주와 배당주는 상대적으로 안정적입니다.
장기 투자자에게는 좋은 매수 기회가 될 수 있는 종목들이 있습니다.`;

    // Check if we have Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return demo data
      return NextResponse.json({
        isDemo: true,
        marketAnalysis: "ANTHROPIC_API_KEY가 설정되지 않아 데모 데이터를 표시합니다. 실제 AI 추천을 받으려면 API 키를 설정하세요.",
        updatedAt: new Date().toISOString().split('T')[0],
        categories: [
          {
            id: "growth",
            name: "성장주",
            description: "미래의 테슬라/애플이 될 수 있는 고성장 기업",
            icon: "rocket",
            holdingPeriod: "5년+",
            stocks: [
              {
                symbol: "DEMO",
                name: "데모 종목",
                currentPrice: 100,
                targetBuyPrice: "$90~$100",
                expectedReturn: "50~100%",
                confidence: 3,
                reason: "API 키 설정 후 실제 AI 추천을 받을 수 있습니다.",
                risks: "데모 데이터입니다",
                catalysts: "ANTHROPIC_API_KEY 환경변수 추가 필요"
              }
            ]
          },
          {
            id: "value",
            name: "가치주",
            description: "저평가된 우량 기업",
            icon: "gem",
            holdingPeriod: "3~5년",
            stocks: []
          },
          {
            id: "dividend",
            name: "배당주",
            description: "장기 배당 수익",
            icon: "coins",
            holdingPeriod: "10년+",
            stocks: []
          },
          {
            id: "opportunity",
            name: "매수 기회",
            description: "저점 매수 기회",
            icon: "target",
            holdingPeriod: "2~3년",
            stocks: []
          }
        ],
        etfPicks: [
          {
            symbol: "SPY",
            name: "SPDR S&P 500 ETF",
            category: "지수추종",
            reason: "S&P 500 추종, 가장 안정적인 장기 투자",
            priority: 1
          }
        ],
        disclaimer: "데모 모드입니다. ANTHROPIC_API_KEY를 설정하면 실제 AI 추천을 받을 수 있습니다."
      });
    }

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const prompt = buildRecommendationPrompt(stocks, marketContext);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let recommendations;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      console.error('Failed to parse AI response:', responseText);
      return NextResponse.json({
        error: 'AI 응답 파싱 실패',
        rawResponse: responseText
      }, { status: 500 });
    }

    return NextResponse.json({
      ...recommendations,
      isDemo: false,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Recommendations error:', error);
    return NextResponse.json({
      error: 'AI 추천 생성 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
