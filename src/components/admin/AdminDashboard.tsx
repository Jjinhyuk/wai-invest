'use client';

import Link from 'next/link';
import { Database, Users, RefreshCw, Clock, CheckCircle, XCircle, TrendingUp, BarChart3, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { Job, JobStatus } from '@/types/database';

interface AdminDashboardProps {
  stats: {
    tickerCount: number;
    metricsCount: number;
    metricsWithScoreCount: number;
    userCount: number;
    lastUpdate: string | null;
  };
  recentJobs: Job[];
}

// 작업 유형 한글 변환
const JOB_TYPE_LABELS: Record<string, string> = {
  'import_tickers': '종목 목록 가져오기',
  'update_metrics': '재무 지표 업데이트',
  'update_prices': '가격 업데이트',
  'backfill_missing': '누락 데이터 보완',
};

export function AdminDashboard({ stats, recentJobs }: AdminDashboardProps) {
  const metricsProgress = stats.tickerCount > 0
    ? (stats.metricsCount / stats.tickerCount) * 100
    : 0;

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
        <h1 className="text-2xl font-bold dark:text-white">관리자 대시보드</h1>
        <p className="text-muted-foreground">시스템 현황을 한눈에 확인하고 데이터를 관리합니다</p>
      </div>

      {/* 개념 설명 카드 */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">관리자 페이지 안내</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li><strong>Ticker (종목)</strong> = 주식 심볼과 기본 정보 (예: AAPL = Apple)</li>
                <li><strong>Metrics (지표)</strong> = 재무 데이터 (P/E, ROE, 시가총액 등)</li>
                <li><strong>Score (점수)</strong> = 품질/성장/가치/위험을 종합한 투자 점수</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">등록된 종목</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tickerCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              데이터베이스에 저장된 미국 주식 수
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지표 수집</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.metricsCount.toLocaleString()}
            </div>
            <Progress value={metricsProgress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              전체 종목 중 {metricsProgress.toFixed(1)}% 수집 완료
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">점수 계산</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metricsWithScoreCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              투자 점수가 계산된 종목 수
            </p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">
              가입한 사용자 수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 마지막 업데이트 */}
      {stats.lastUpdate && (
        <Card className="dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                마지막 데이터 업데이트: {formatDateTime(stats.lastUpdate)} ({formatRelativeTime(stats.lastUpdate)})
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 빠른 메뉴 */}
      <Card className="dark:bg-slate-800">
        <CardHeader>
          <CardTitle>빠른 메뉴</CardTitle>
          <CardDescription>자주 사용하는 관리 기능에 빠르게 접근합니다</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/data">
              <Database className="h-4 w-4 mr-2" />
              데이터 관리
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <Users className="h-4 w-4 mr-2" />
              사용자 관리
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* 최근 작업 */}
      <Card className="dark:bg-slate-800">
        <CardHeader>
          <CardTitle>최근 작업 내역</CardTitle>
          <CardDescription>데이터 가져오기 및 업데이트 작업 기록입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">아직 실행된 작업이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">
                데이터 관리 페이지에서 종목을 동기화해보세요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
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
                      {formatRelativeTime(job.created_at)}
                    </p>
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
                      </>
                    )}
                    {job.failed > 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        {job.failed}개 실패
                      </p>
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
