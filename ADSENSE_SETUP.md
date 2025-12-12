# Google AdSense 설정 가이드

## 📋 개요

WAI-Invest는 데스크톱 화면에서 양옆에 광고 배너를 표시하도록 설정되어 있습니다.
모바일/태블릿에서는 자동으로 숨겨져서 사용자 경험을 해치지 않습니다.

## 🎯 광고 배치

- **왼쪽 사이드바**: 160x600 세로 배너
- **오른쪽 사이드바**: 160x600 세로 배너
- **표시 조건**: 화면 너비 1280px 이상 (XL breakpoint)
- **동작**: Sticky 포지션으로 스크롤 시 따라다님

## 🔧 설정 방법

### 1. Google AdSense 계정 생성 및 승인

1. [Google AdSense](https://www.google.com/adsense/) 접속
2. 계정 생성 및 사이트 등록
3. 사이트 승인 대기 (보통 1-2주 소요)

### 2. 광고 단위 생성

승인 후 AdSense 대시보드에서:

1. **광고** → **광고 단위 기준** → **디스플레이 광고** 선택
2. **세로형** 광고 선택
3. 크기: **160 x 600** (와이드 스카이스크래퍼) 권장
4. 광고 단위 2개 생성 (왼쪽/오른쪽용)

### 3. 코드에 AdSense ID 입력

#### A. AdSense 스크립트 업데이트

`src/app/layout.tsx` 파일에서:

```tsx
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
/>
```

위 코드의 `ca-pub-XXXXXXXXXXXXXXXX` 부분을 본인의 AdSense 클라이언트 ID로 교체하세요.

#### B. 광고 슬롯 ID 입력

`src/app/layout.tsx` 파일에서 두 군데 수정:

**왼쪽 광고:**
```tsx
<AdBanner
  adFormat="vertical"
  showPlaceholder={true}
  adClient="ca-pub-XXXXXXXXXXXXXXXX" // 주석 제거 후 실제 ID 입력
  adSlot="1234567890" // 주석 제거 후 왼쪽 광고 슬롯 ID 입력
/>
```

**오른쪽 광고:**
```tsx
<AdBanner
  adFormat="vertical"
  showPlaceholder={true}
  adClient="ca-pub-XXXXXXXXXXXXXXXX" // 주석 제거 후 실제 ID 입력
  adSlot="0987654321" // 주석 제거 후 오른쪽 광고 슬롯 ID 입력 (왼쪽과 다른 ID)
/>
```

### 4. 테스트

로컬에서 테스트:
```bash
npm run dev
```

브라우저를 1280px 이상 너비로 확장해서 양옆 광고가 보이는지 확인하세요.

**주의**: 
- 개발 환경에서는 광고가 표시되지 않을 수 있습니다
- 실제 배포 후 프로덕션 환경에서 확인하세요
- 본인 광고를 클릭하지 마세요 (정책 위반)

### 5. 배포

```bash
git add .
git commit -m "Add Google AdSense integration"
git push
```

Vercel에서 자동으로 배포됩니다.

## 📱 반응형 동작

- **1280px 이상 (XL)**: 양옆 광고 표시, 메인 콘텐츠 가운데 배치
- **1024px - 1279px (LG)**: 광고 숨김, 메인 콘텐츠 전체 너비
- **768px - 1023px (MD)**: 광고 숨김, 메인 콘텐츠 전체 너비
- **768px 미만 (SM)**: 광고 숨김, 메인 콘텐츠 전체 너비

## 💰 예상 수익

세로 배너는 일반적으로:
- **CPM**: $1-5 (1000회 노출당)
- **클릭률**: 0.5-2%
- **클릭당 수익**: $0.10-1.00

실제 수익은 트래픽, 주제, 지역에 따라 크게 달라집니다.

## 🔍 추가 최적화

### 광고 크기 변경

더 큰 화면에서 더 넓은 광고를 원한다면 `layout.tsx` 수정:

```tsx
<aside className="hidden xl:block xl:w-48 2xl:w-64 flex-shrink-0">
```

그리고 `AdBanner` 컴포넌트에서 크기 조정.

### 추가 광고 위치

- 메인 콘텐츠 내부 (인피드 광고)
- 모바일용 하단 고정 광고
- 페이지 상단 가로 배너

## ⚠️ 주의사항

1. **AdSense 정책 준수**: [AdSense 프로그램 정책](https://support.google.com/adsense/answer/48182) 숙지
2. **클릭 유도 금지**: "광고를 클릭해주세요" 등의 문구 금지
3. **과도한 광고 금지**: 콘텐츠 대비 광고 비율 적절히 유지
4. **본인 클릭 금지**: 본인 광고 클릭 시 계정 정지 위험

## 📊 성과 추적

AdSense 대시보드에서 확인 가능:
- 노출수
- 클릭수
- 클릭률 (CTR)
- 페이지 RPM (페이지당 수익)
- 예상 수익

## 🆘 문제 해결

### 광고가 표시되지 않음

1. AdSense 계정이 승인되었는지 확인
2. 클라이언트 ID와 슬롯 ID가 올바른지 확인
3. 브라우저 광고 차단기 비활성화
4. 개발자 도구 콘솔에서 오류 확인
5. 프로덕션 환경에서 테스트 (로컬은 안 될 수 있음)

### 레이아웃이 깨짐

1. 브라우저 창 너비가 1280px 이상인지 확인
2. CSS 캐시 삭제 후 재시도
3. 개발자 도구로 요소 검사

## 📚 참고 자료

- [Google AdSense 고객센터](https://support.google.com/adsense/)
- [광고 단위 가이드](https://support.google.com/adsense/answer/9274025)
- [최적화 팁](https://support.google.com/adsense/answer/9183549)

