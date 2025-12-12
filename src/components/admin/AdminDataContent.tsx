'use client';

import { useState } from 'react';
import { Database, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
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
        alert(`Imported ${data.count} tickers`);
        window.location.reload();
      } else {
        alert('Import failed: ' + data.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
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
        alert(`Updated metrics for ${data.updated} stocks`);
        window.location.reload();
      } else {
        alert('Update failed: ' + data.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Data Management</h1>
        <p className="text-muted-foreground">Import tickers and update metrics</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tickers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickerCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricsCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {missingMetricsCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Import Actions</CardTitle>
          <CardDescription>
            Import stock data from external providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Import Tickers</p>
              <p className="text-sm text-muted-foreground">
                Fetch list of US stocks from provider
              </p>
            </div>
            <Button onClick={handleImportTickers} disabled={isImporting}>
              <Download className="h-4 w-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Update Metrics</p>
              <p className="text-sm text-muted-foreground">
                Fetch metrics for stocks missing data (batch of 50)
              </p>
              {missingMetricsCount > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {missingMetricsCount} stocks need metrics
                </p>
              )}
            </div>
            <Button
              onClick={handleUpdateMetrics}
              disabled={isUpdating || missingMetricsCount === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Update Batch'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Missing metrics preview */}
      {tickersWithoutMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stocks Missing Metrics</CardTitle>
            <CardDescription>
              Showing first {Math.min(tickersWithoutMetrics.length, 20)} of {missingMetricsCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tickersWithoutMetrics.slice(0, 20).map((symbol) => (
                <Badge key={symbol} variant="outline">
                  {symbol}
                </Badge>
              ))}
              {tickersWithoutMetrics.length > 20 && (
                <Badge variant="secondary">+{tickersWithoutMetrics.length - 20} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job history */}
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>Recent data import and update jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
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
                      {formatDateTime(job.created_at)}
                    </p>
                    {job.error_message && (
                      <p className="text-xs text-destructive mt-1">
                        {job.error_message}
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
                          <p className="text-xs text-destructive mt-1">
                            {job.failed} failed
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
