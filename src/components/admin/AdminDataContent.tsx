'use client';

import { useState } from 'react';
import { Database, Download, RefreshCw, CheckCircle, XCircle, Clock, Zap, Info, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { Job, JobStatus } from '@/types/database';

interface AdminDataContentProps {
  jobs: Job[];
  tickerCount: number;
  metricsCount: number;
  tickersWithoutMetrics: string[];
  userId: string;
}

// 작업 유형 한글 변환
const JOB_TYPE_LABELS: Record<string, string> = {
  'import_tickers': '종목 목록 가져오기',
  'update_metrics': '재무 지표 업데이트',
  'update_prices': '가격 업데이트',
  'backfill_missing': '누락 데이터 보완',
};

export function AdminDataContent({
  jobs: initialJobs,
  tickerCount,
  metricsCount,
  tickersWithoutMetrics,
  userId,
}: AdminDataContentProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isImporting, setIsImporting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  const missingMetricsCount = tickerCount - metricsCount;

  const handleImportTickers = async () => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/admin/tickers/import', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert(`${data.count}개 종목을 가져왔습니다`);
        window.location.reload();
      } else {
        alert('가져오기 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('가져오기 실패');
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateMetrics = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/metrics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: tickersWithoutMetrics.slice(0, 50) }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`${data.updated}개 종목의 지표를 업데이트했습니다`);
        window.location.reload();
      } else {
        alert('업데이트 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('업데이트 실패');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickSync = async (limit: number = 50) => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/admin/stocks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit }),
      });
      const data = await response.json();
      if (data.success) {
        setSyncResult(
          `완료: ${data.tickersImported}개 종목 등록, ${data.metricsUpdated}개 지표 업데이트` +
          (data.metricsFailed > 0 ? ` (${data.metricsFailed}개 실패)` : '')
        );
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncResult('동기화 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult('동기화 중 오류 발생');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle className="h-3 w-3 mr-1" />완료</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 border-0"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />진행 중</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-0"><XCircle className="h-3 w-3 mr-1" />실패</Badge>;
      case 'pending':
        return <Badge className="bg-slate-100 text-slate-700 border-0"><Clock className="h-3 w-3 mr-1" />대기 중</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white">데이터 관리</h1>
        <p className="text-muted-foreground">종목 데이터를 가져오고 재무 지표를 업데이트합니다</p>
      </div>

      {/* 개념 설명 */}
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">데이터 관리 흐름 안내</p>
              <div className="grid gap-2 text-amber-700 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span><strong>종목 동기화</strong> - 미국 주식 목록(AAPL, MSFT 등)을 데이터베이스에 저장</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span><strong>지표 수집</strong> - 각 종목의 재무 데이터(P/E, ROE, 시가총액 등)를 API에서 가져옴</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span><strong>점수 계산</strong> - 수집된 지표로 투자 점수(품질/성장/가치/위험) 자동 계산</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 현황 통계 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dark:bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              등록된 종목
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickerCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ticker = 주식 심볼 (예: AAPL)</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              지표 수집 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Metrics = 재무 지표 데이터</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              지표 미수집
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {missingMetricsCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">아직 데이터가 없는 종목</p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 동기화 */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            빠른 종목 동기화
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            S&P 500 대표 종목의 기본 정보와 재무 지표를 한 번에 가져옵니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              <strong>Finnhub API</strong>를 사용하여 실시간 데이터를 가져옵니다.
              무료 API이므로 한 번에 많은 종목을 가져오면 시간이 걸릴 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleQuickSync(30)}
                disabled={isSyncing}
                variant="outline"
                className="border-blue-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                30개 (빠름)
              </Button>
              <Button
                onClick={() => handleQuickSync(50)}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                50개 (권장)
              </Button>
              <Button
                onClick={() => handleQuickSync(100)}
                disabled={isSyncing}
                variant="outline"
                className="border-blue-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                100개 (전체)
              </Button>
            </div>
          </div>
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin" />
              종목 데이터 동기화 중... API 호출 제한으로 약 1-2분 소요됩니다
            </div>
          )}
          {syncResult && (
            <div className={`flex items-center gap-2 text-sm ${
              syncResult.includes('실패') ? 'text-red-600' : 'text-green-600'
            }`}>
              {syncResult.includes('실패') ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {syncResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고급 옵션 */}
      <Card className="dark:bg-slate-800">
        <CardHeader>
          <CardTitle>고급 데이터 관리</CardTitle>
          <CardDescription>
            개별적으로 종목 목록이나 지표를 가져올 때 사용합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-700">
            <div>
              <p className="font-medium">종목 목록 가져오기</p>
              <p className="text-sm text-muted-foreground">
                API 제공자에서 미국 주식 목록만 가져옵니다 (지표 제외)
              </p>
            </div>
            <Button onClick={handleImportTickers} disabled={isImporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {isImporting ? '가져오는 중...' : '가져오기'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-700">
            <div>
              <p className="font-medium">지표 일괄 업데이트</p>
              <p className="text-sm text-muted-foreground">
                지표가 없는 종목의 재무 데이터를 가져옵니다 (50개씩)
              </p>
              {missingMetricsCount > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {missingMetricsCount}개 종목의 지표가 필요합니다
                </p>
              )}
            </div>
            <Button
              onClick={handleUpdateMetrics}
              disabled={isUpdating || missingMetricsCount === 0}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? '업데이트 중...' : '업데이트'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 지표 미수집 종목 목록 */}
      {tickersWithoutMetrics.length > 0 && (
        <Card className="dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              지표 미수집 종목
            </CardTitle>
            <CardDescription>
              아래 종목들은 아직 재무 지표 데이터가 없습니다
              (처음 {Math.min(tickersWithoutMetrics.length, 20)}개 표시)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tickersWithoutMetrics.slice(0, 20).map((symbol) => (
                <Badge key={symbol} variant="outline" className="dark:border-slate-600">
                  {symbol}
                </Badge>
              ))}
              {tickersWithoutMetrics.length > 20 && (
                <Badge className="bg-slate-100 text-slate-600 border-0">
                  +{tickersWithoutMetrics.length - 20}개 더
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 작업 기록 */}
      <Card className="dark:bg-slate-800">
        <CardHeader>
          <CardTitle>작업 기록</CardTitle>
          <CardDescription>최근 실행된 데이터 처리 작업 내역입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">아직 작업 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-700"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {JOB_TYPE_LABELS[job.type] || job.type.replace(/_/g, ' ')}
                      </span>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(job.created_at)}
                    </p>
                    {job.error_message && (
                      <p className="text-xs text-red-500 mt-1">
                        오류: {job.error_message}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {job.total > 0 && (
                      <>
                        <p className="font-medium">
                          {job.done} / {job.total}
                        </p>
                        <Progress
                          value={(job.done / job.total) * 100}
                          className="h-2 w-24 mt-1"
                        />
                        {job.failed > 0 && (
                          <p className="text-xs text-red-500 mt-1">
                            {job.failed}개 실패
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
