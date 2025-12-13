# WAI-Invest 프로젝트 컨텍스트

## 프로젝트 개요
- **목적**: 미국 주식 분석 개인용 웹앱 (추후 배포 가능 구조)
- **기술 스택**: Next.js 16, TypeScript, Tailwind CSS 4, Supabase, shadcn/ui
- **GitHub**: https://github.com/Jjinhyuk/wai-invest.git
- **Vercel**: wai-invest-0.vercel.app

## 주요 페이지 구조
- `/login` - Google OAuth 로그인
- `/dashboard` - 대시보드 (포트폴리오 요약, 알림 후보)
- `/market` - 시장 현황 (지수, 지표, 섹터 히트맵, Fear&Greed)
- `/screener` - 스크리너 (프리셋 필터, 종목 검색)
- `/watchlist` - 관심 종목
- `/portfolio` - 포트폴리오 관리 (CSV/Excel 업로드)
- `/settings` - 알림 설정
- `/stocks/[symbol]` - 종목 상세 (지표 툴팁 포함)
- `/admin` - 관리자 (데이터 수집, 회원 관리)

## 완료된 기능
- Google OAuth 로그인
- 온보딩 모달 (첫 로그인 가이드)
- 스크리너 프리셋 (퀄리티/가치/턴어라운드) + 필터 조건 표시
- 종목 상세 지표 툴팁 (P/E, PEG, ROE 등 설명)
- 데이터 신선도 표시 (마지막 업데이트 시간)
- 관심종목 페이지
- 시장 현황 페이지 (지수, Fear&Greed, 섹터 히트맵)
- 다크모드 토글
- UI/UX 한글화

## 데이터 소스
- FMP API (Financial Modeling Prep) - 유료, 분당 300콜 제한
- 환경변수: `FMP_API_KEY`

## Supabase 테이블
- `profiles` - 사용자 프로필
- `tickers` - 종목 기본 정보
- `metrics_latest` - 최신 재무 지표
- `holdings` - 보유 종목
- `watchlists` / `watchlist_items` - 관심 종목
- `alert_settings` / `alert_events` - 알림 설정

## 환경변수 (Vercel 설정 필요)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FMP_API_KEY`

## 알려진 이슈/주의사항
- SSR hydration: 클라이언트 전용 로직(localStorage, Date)은 useEffect 내에서 처리
- 모든 페이지에 `export const dynamic = 'force-dynamic'` 적용 (빌드 시 환경변수 문제 방지)

## 현재 진행 상태 (2024-12)
- UI/UX 한글화 및 개선 완료
- 시장 현황 페이지 완료 (mock data 사용 중)
- 다크모드 완료
- Vercel 배포 완료

## 다음 작업 (TODO)
1. **실제 데이터 연동** ← 다음 세션에서 진행 예정
   - FMP API로 실시간 시장 데이터 가져오기
   - 종목 데이터 실제 연동
2. UI 세부 조정
3. 추가 기능 구현

## 다음 개선 가능 항목
- 실시간 시장 데이터 연동 (현재 mock data)
- 포트폴리오 트랜잭션 기록 (매수/매도/배당)
- 알림 이메일 발송 기능
- 반응형 모바일 UI
