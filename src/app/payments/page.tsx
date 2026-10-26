'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ReceiptText,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { PaymentListItem } from '@/lib/api/types';
import { formatDate, formatCurrencyPaise } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  const fetchPayments = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPayments({
        page,
        limit: 10,
        status: statusFilter,
        provider: providerFilter,
        query: searchQuery.trim() || undefined,
      });
      setPayments(res.items);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, providerFilter, searchQuery]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments(1);
  };

  return (
    <AdminShell title="Payments & Transactions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payments & Transactions
            </h1>
            <p className="text-sm text-slate-500">
              Audit log of all checkout intents, verified webhook charges, and promotional redemptions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(pagination.page)}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Security & Refund Notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-900">
                Payment Provider Integrity & Security Boundary
              </span>
              <p className="mt-0.5 leading-relaxed text-slate-600">
                All records represent authoritative events verified cryptographically via Razorpay HMAC-SHA256 signatures or developer sandbox simulators.
                Automated refunds are disabled in this control panel; refund requests must be reconciled directly via the primary Razorpay merchant console.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search reference or checkout ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="pay-status-filter" className="text-xs font-semibold text-slate-600">
                Status:
              </label>
              <select
                id="pay-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="pay-provider-filter" className="text-xs font-semibold text-slate-600">
                Provider:
              </label>
              <select
                id="pay-provider-filter"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Providers</option>
                <option value="razorpay">Razorpay</option>
                <option value="mock">Sandbox (Mock)</option>
                <option value="promo">Promotional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchPayments(1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Transactions Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference / Checkout ID</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <ReceiptText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No transactions match the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {p.businessName || p.businessId}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {p.eventType}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {p.provider} {p.isSimulated && '(Simulated)'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {p.amount === 0 ? 'Free' : formatCurrencyPaise(p.amount, p.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === 'success'
                            ? 'success'
                            : p.status === 'failed'
                            ? 'destructive'
                            : 'warning'
                        }
                        className="capitalize"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500 max-w-xs truncate">
                      {p.paymentReference || p.checkoutId || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(p.createdAt)}
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
                  onClick={() => fetchPayments(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(pagination.page + 1)}
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
