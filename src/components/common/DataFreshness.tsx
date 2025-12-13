'use client';

import { Clock, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DataFreshnessProps {
  lastUpdate?: string | Date | null;
  className?: string;
  showLabel?: boolean;
}

export function DataFreshness({ lastUpdate, className, showLabel = true }: DataFreshnessProps) {
  if (!lastUpdate) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 text-sm ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        {showLabel && <span>데이터 없음</span>}
      </div>
    );
  }

  const updateDate = new Date(lastUpdate);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Determine freshness level
  let status: 'fresh' | 'stale' | 'old';
  let statusColor: string;
  let statusBg: string;
  let StatusIcon: typeof CheckCircle2;

  if (diffHours < 24) {
    status = 'fresh';
    statusColor = 'text-green-600';
    statusBg = 'bg-green-100';
    StatusIcon = CheckCircle2;
  } else if (diffDays < 7) {
    status = 'stale';
    statusColor = 'text-yellow-600';
    statusBg = 'bg-yellow-100';
    StatusIcon = RefreshCw;
  } else {
    status = 'old';
    statusColor = 'text-red-500';
    statusBg = 'bg-red-100';
    StatusIcon = AlertTriangle;
  }

  // Format time ago
  let timeAgo: string;
  if (diffHours < 1) {
    const diffMinutes = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60));
    timeAgo = `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays}일 전`;
  } else {
    timeAgo = updateDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  }

  const statusLabels = {
    fresh: '최신',
    stale: '업데이트 필요',
    old: '오래됨',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={`${statusBg} ${statusColor} border-0 gap-1.5 px-2.5 py-1`}>
        <StatusIcon className="h-3.5 w-3.5" />
        {showLabel && statusLabels[status]}
      </Badge>
      <span className="text-sm text-slate-500 flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" />
        {timeAgo} 업데이트
      </span>
    </div>
  );
}

// Compact version for table cells
export function DataFreshnessCompact({ lastUpdate }: { lastUpdate?: string | Date | null }) {
  if (!lastUpdate) {
    return <span className="text-slate-400">-</span>;
  }

  const updateDate = new Date(lastUpdate);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo: string;
  let colorClass: string;

  if (diffHours < 1) {
    timeAgo = '방금';
    colorClass = 'text-green-600';
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}시간`;
    colorClass = 'text-green-600';
  } else if (diffDays < 7) {
    timeAgo = `${diffDays}일`;
    colorClass = 'text-yellow-600';
  } else {
    timeAgo = `${diffDays}일`;
    colorClass = 'text-red-500';
  }

  return (
    <span className={`text-xs ${colorClass}`}>
      {timeAgo} 전
    </span>
  );
}
