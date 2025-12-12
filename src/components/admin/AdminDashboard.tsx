'use client';

import Link from 'next/link';
import { Database, Users, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

export function AdminDashboard({ stats, recentJobs }: AdminDashboardProps) {
  const metricsProgress = stats.tickerCount > 0
    ? (stats.metricsCount / stats.tickerCount) * 100
    : 0;

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="default"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and data management</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickers</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tickerCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">US stocks in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metrics Coverage</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.metricsCount.toLocaleString()}
            </div>
            <Progress value={metricsProgress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metricsProgress.toFixed(1)}% of tickers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Scores</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metricsWithScoreCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Stocks with calculated scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Last update */}
      {stats.lastUpdate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last data update: {formatDateTime(stats.lastUpdate)} ({formatRelativeTime(stats.lastUpdate)})
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/data">Manage Data</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users">View Users</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Latest data import and update jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {job.type.replace(/_/g, ' ')}
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
                      <p className="text-xs text-destructive mt-1">
                        {job.failed} failed
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
