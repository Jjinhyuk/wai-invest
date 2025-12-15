import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

interface AnalysisRequest {
  symbol: string;
}

interface StockData {
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
    ps: number | null;
    pb: number | null;
    peg: number | null;
    roe: number | null;
    roic: number | null;
    gross_margin: number | null;
    operating_margin: number | null;
    net_margin: number | null;
    revenue_growth_yoy: number | null;
    eps_growth_yoy: number | null;
    debt_to_equity: number | null;
    current_ratio: number | null;
    fcf: number | null;
    dividend_yield: number | null;
    beta: number | null;
    week52_high: number | null;
    week52_low: number | null;
    score_total: number | null;
  } | null;
}

function buildAnalysisPrompt(data: StockData): string {
  const { ticker, metrics } = data;

  const metricsText = metrics ? `
현재 주가: $${metrics.price?.toFixed(2) || 'N/A'}
시가총액: $${metrics.market_cap ? (metrics.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
52주 최고: $${metrics.week52_high?.toFixed(2) || 'N/A'}
52주 최저: $${metrics.week52_low?.toFixed(2) || 'N/A'}

밸류에이션:
- P/E: ${metrics.pe?.toFixed(2) || 'N/A'}
- P/S: ${metrics.ps?.toFixed(2) || 'N/A'}
- P/B: ${metrics.pb?.toFixed(2) || 'N/A'}
- PEG: ${metrics.peg?.toFixed(2) || 'N/A'}

수익성:
- ROE: ${metrics.roe ? (metrics.roe * 100).toFixed(1) + '%' : 'N/A'}
- ROIC: ${metrics.roic ? (metrics.roic * 100).toFixed(1) + '%' : 'N/A'}
- 매출총이익률: ${metrics.gross_margin ? (metrics.gross_margin * 100).toFixed(1) + '%' : 'N/A'}
- 영업이익률: ${metrics.operating_margin ? (metrics.operating_margin * 100).toFixed(1) + '%' : 'N/A'}
- 순이익률: ${metrics.net_margin ? (metrics.net_margin * 100).toFixed(1) + '%' : 'N/A'}

성장성:
- 매출 성장률(YoY): ${metrics.revenue_growth_yoy ? (metrics.revenue_growth_yoy * 100).toFixed(1) + '%' : 'N/A'}
- EPS 성장률(YoY): ${metrics.eps_growth_yoy ? (metrics.eps_growth_yoy * 100).toFixed(1) + '%' : 'N/A'}

재무 건전성:
- 부채비율(D/E): ${metrics.debt_to_equity?.toFixed(2) || 'N/A'}
- 유동비율: ${metrics.current_ratio?.toFixed(2) || 'N/A'}
- FCF: $${metrics.fcf ? (metrics.fcf / 1e9).toFixed(2) + 'B' : 'N/A'}

기타:
- 배당수익률: ${metrics.dividend_yield ? (metrics.dividend_yield * 100).toFixed(2) + '%' : 'N/A'}
- 베타: ${metrics.beta?.toFixed(2) || 'N/A'}
- 종합점수: ${metrics.score_total?.toFixed(0) || 'N/A'}/100
` : '재무 지표 데이터가 없습니다.';

  return `당신은 미국 주식 투자 분석 전문가입니다. 중장기(3~10년) 관점에서 개인 투자자를 위한 종목 분석을 제공합니다.

다음 종목을 분석해주세요:

종목: ${ticker.symbol} (${ticker.name})
섹터: ${ticker.sector || '미분류'}
산업: ${ticker.industry || '미분류'}

${metricsText}

다음 JSON 형식으로만 응답해주세요. 다른 텍스트 없이 JSON만 출력하세요:

{
  "opinion": "매수" | "관망" | "매도" 중 하나,
  "confidence": 1~5 사이 숫자 (확신도),
  "fairValueLow": 적정가치 하단 (숫자, 달러),
  "fairValueHigh": 적정가치 상단 (숫자, 달러),
  "currentVsValue": "저평가" | "적정" | "고평가" 중 하나,
  "holdingPeriod": "추천 보유기간 (예: 3~5년)",
  "investorType": "어떤 투자자에게 적합한지 (예: 성장주 투자자, 배당 투자자 등)",
  "summary": "한 문장 요약 (50자 이내)",
  "investmentPoints": [
    "투자 포인트 1",
    "투자 포인트 2",
    "투자 포인트 3"
  ],
  "risks": [
    "리스크 1",
    "리스크 2",
    "리스크 3"
  ],
  "conclusion": "종합 의견 (2~3문장, 구체적인 매수 전략 포함. 예: '$X 이하에서 분할매수 추천')"
}

중요 지침:
1. 적정가치는 현재 재무지표와 성장률을 기반으로 보수적으로 산정하세요
2. PEG < 1.5, ROE > 15%, 영업이익률 > 15%면 긍정적으로 평가
3. 부채비율 > 1이면 리스크로 언급
4. 52주 고점 대비 하락폭이 크면 매수 기회로 볼 수 있음
5. 한국어로 작성하고, 개인 투자자가 이해하기 쉽게 설명하세요
6. "투자 조언이 아님" 같은 면책 문구는 넣지 마세요 (UI에서 별도 표시함)`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body: AnalysisRequest = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json({ error: '종목 심볼이 필요합니다' }, { status: 400 });
    }

    // Get stock data from database
    const { data: ticker } = await supabase
      .from('tickers')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (!ticker) {
      return NextResponse.json({ error: '종목을 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: metrics } = await supabase
      .from('metrics_latest')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    // Check if we have Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock data for development
      return NextResponse.json({
        analysis: {
          opinion: '관망',
          confidence: 3,
          fairValueLow: metrics?.price ? metrics.price * 0.85 : 100,
          fairValueHigh: metrics?.price ? metrics.price * 1.15 : 150,
          currentVsValue: '적정',
          holdingPeriod: '3~5년',
          investorType: '성장주 투자자',
          summary: 'AI 분석을 위해 ANTHROPIC_API_KEY 설정이 필요합니다.',
          investmentPoints: [
            'API 키 설정 후 실제 AI 분석이 제공됩니다',
            '현재는 데모 데이터입니다',
            '환경변수에 ANTHROPIC_API_KEY를 추가하세요'
          ],
          risks: [
            'API 키 미설정',
            '실제 분석이 아닌 데모 데이터',
            'Vercel 환경변수에도 추가 필요'
          ],
          conclusion: 'ANTHROPIC_API_KEY를 .env.local과 Vercel 환경변수에 추가하면 실제 AI 분석을 받을 수 있습니다.'
        },
        ticker,
        metrics,
        isDemo: true
      });
    }

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const stockData: StockData = {
      ticker: {
        symbol: ticker.symbol,
        name: ticker.name,
        sector: ticker.sector,
        industry: ticker.industry,
      },
      metrics: metrics,
    };

    const prompt = buildAnalysisPrompt(stockData);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let analysis;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
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
      analysis,
      ticker,
      metrics,
      isDemo: false,
      analyzedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    return NextResponse.json({
      error: 'AI 분석 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
