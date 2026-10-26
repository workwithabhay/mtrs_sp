'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { OperationsSummary, WebhookListItem } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function OperationsPage() {
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, hookRes] = await Promise.all([
        adminApi.getBillingOperations(),
        adminApi.getWebhooks({ page, limit: 10 }),
      ]);
      setSummary(sumRes);
      setWebhooks(hookRes.items);
      setPagination(hookRes.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch billing operations';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations(1);
  }, [fetchOperations]);

  return (
    <AdminShell title="Billing Operations & Observability">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Billing Operations
            </h1>
            <p className="text-sm text-slate-500">
              Real-time health monitoring of payment webhooks, signature verification, and provider status.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOperations(pagination.page)}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchOperations(1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Operational Status Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Payment Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold uppercase text-slate-900">
                    {summary?.provider}
                  </span>
                  <Badge variant={summary?.isSimulated ? 'secondary' : 'success'}>
                    {summary?.isSimulated ? 'Sandbox Mock' : 'Live Gateway'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Processed Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600">
                    {summary?.processedWebhooks}
                  </span>
                  <span className="text-xs text-slate-500">
                    of {summary?.totalWebhooks} total
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Webhook Failures
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold ${
                      (summary?.failedWebhooks ?? 0) > 0 ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {summary?.failedWebhooks}
                  </span>
                  <span className="text-xs text-slate-500">unresolved errors</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-600">
                    {summary?.pendingPaymentsCount}
                  </span>
                  <span className="text-xs text-slate-500">awaiting settlement</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Assurance */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-900">
                HMAC-SHA256 Webhook Verification Active
              </span>
              <p className="mt-0.5 text-slate-500">
                All incoming webhook requests from payment providers are cryptographically validated using constant-time timing-safe comparisons before persistence. Sensitive keys, tokens, and payloads are strictly scrubbed from browser responses.
              </p>
            </div>
          </div>
        </div>

        {/* Webhooks Event Log Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Recent Webhook Ingestion Events</h3>
              <p className="text-xs text-slate-500">Real database records from payment provider callbacks</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Event ID</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Processed Status</TableHead>
                <TableHead>Processed At</TableHead>
                <TableHead>Error Details</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <Activity className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No webhook events logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="uppercase font-mono text-xs font-semibold text-slate-800">
                      {w.provider}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600 max-w-xs truncate">
                      {w.eventId}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-800">
                      {w.eventType}
                    </TableCell>
                    <TableCell>
                      <Badge variant={w.processed ? 'success' : w.error ? 'destructive' : 'warning'}>
                        {w.processed ? 'Processed' : w.error ? 'Failed' : 'Queued'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(w.processedAt)}
                    </TableCell>
                    <TableCell className="text-xs text-red-600 max-w-xs truncate">
                      {w.error || 'None'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(w.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6">
              <div className="text-xs text-slate-500">
                Page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOperations(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOperations(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="h-8 gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
