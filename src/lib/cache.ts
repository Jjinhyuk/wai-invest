/**
 * 서버 사이드 메모리 캐시
 * API 호출을 최소화하고 rate limit을 관리합니다.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5분 기본 TTL

  /**
   * 캐시에서 데이터를 가져옵니다.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // 만료된 경우
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터를 저장합니다.
   * @param ttl - Time To Live in milliseconds (기본: 5분)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultTTL),
    });
  }

  /**
   * 캐시에서 데이터를 삭제합니다.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 전체 캐시를 비웁니다.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 엔트리를 정리합니다.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시 통계를 반환합니다.
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 싱글톤 인스턴스
export const cache = new MemoryCache();

// 캐시 키 생성 헬퍼
export const CacheKeys = {
  marketIndices: () => 'market:indices',
  marketIndicators: () => 'market:indicators',
  marketCommodities: () => 'market:commodities',
  fearGreed: () => 'market:fear-greed',
  stockQuote: (symbol: string) => `stock:quote:${symbol}`,
  stockMetrics: (symbol: string) => `stock:metrics:${symbol}`,
  stockProfile: (symbol: string) => `stock:profile:${symbol}`,
  sectorPerformance: () => 'market:sectors',
};

// TTL 설정 (밀리초)
export const CacheTTL = {
  marketData: 5 * 60 * 1000,      // 5분 - 시장 데이터
  stockQuote: 1 * 60 * 1000,      // 1분 - 주식 시세 (자주 변동)
  stockMetrics: 60 * 60 * 1000,   // 1시간 - 재무 지표 (덜 변동)
  stockProfile: 24 * 60 * 60 * 1000, // 24시간 - 회사 프로필
};
