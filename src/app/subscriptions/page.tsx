'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { SubscriptionListItem } from '@/lib/api/types';
import { formatDate, formatCurrencyPaise } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('');

  // Override Modal
  const [overrideTarget, setOverrideTarget] = useState<SubscriptionListItem | null>(null);
  const [overrideEnd, setOverrideEnd] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  const fetchSubscriptions = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSubscriptions({
        page,
        limit: 10,
        status: statusFilter,
        planId: planFilter.trim() || undefined,
      });
      setSubscriptions(res.items);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch subscriptions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, planFilter]);

  useEffect(() => {
    fetchSubscriptions(1);
  }, [fetchSubscriptions]);

  const openOverrideDialog = (sub: SubscriptionListItem) => {
    setOverrideTarget(sub);
    setOverrideEnd(sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString().slice(0, 10) : '');
    setOverrideStatus(sub.status);
    setOverrideReason('');
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTarget) return;
    if (!overrideReason.trim() || overrideReason.trim().length < 3) {
      toast.error('An audit explanation is required.');
      return;
    }

    setIsOverriding(true);
    try {
      const isoEnd = overrideEnd ? new Date(overrideEnd).toISOString() : undefined;
      await adminApi.overrideSubscription(overrideTarget.id, {
        currentPeriodEnd: isoEnd,
        status: overrideStatus,
        reason: overrideReason.trim(),
      });
      toast.success('Subscription entitlement successfully updated and audited.');
      setOverrideTarget(null);
      fetchSubscriptions(pagination.page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Override failed';
      toast.error(msg);
    } finally {
      setIsOverriding(false);
    }
  };

  return (
    <AdminShell title="Subscription & Entitlement Directory">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
            <p className="text-sm text-slate-500">
              Live account entitlements, renewal periods, and audited manual overrides.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubscriptions(pagination.page)}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <Input
              placeholder="Filter by plan ID (e.g. monthly, free4you)..."
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="max-w-xs h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sub-status-filter" className="text-xs font-semibold text-slate-600">
              Status:
            </label>
            <select
              id="sub-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchSubscriptions(1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Subscriptions Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Plan ID</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Price Snapshot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                    <ShieldCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No subscription records found.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {s.businessName || s.businessId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[11px] uppercase">
                        {s.planId}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-slate-600">{s.billingInterval}</TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {s.priceSnapshot
                        ? formatCurrencyPaise(s.priceSnapshot.amount, s.priceSnapshot.currency)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'active'
                            ? 'success'
                            : s.status === 'cancelled'
                            ? 'warning'
                            : s.status === 'expired'
                            ? 'destructive'
                            : 'default'
                        }
                        className="capitalize"
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(s.currentPeriodEnd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openOverrideDialog(s)}
                        className="gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Override</span>
                      </Button>
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
                  onClick={() => fetchSubscriptions(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchSubscriptions(pagination.page + 1)}
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

        {/* Administrative Override Dialog */}
        <Dialog open={Boolean(overrideTarget)} onOpenChange={(open) => !open && setOverrideTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Subscription Entitlement</DialogTitle>
              <DialogDescription>
                Manual adjustments to business entitlements must have a valid operational justification.
                This action is audited.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 pt-2">
              <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                <p>
                  <strong>Business:</strong> {overrideTarget?.businessName || overrideTarget?.businessId}
                </p>
                <p>
                  <strong>Current Plan:</strong> {overrideTarget?.planId?.toUpperCase()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="override-status-select" className="block text-xs font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    id="override-status-select"
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="override-date-input" className="block text-xs font-semibold text-slate-700">
                    Period End Date
                  </label>
                  <Input
                    id="override-date-input"
                    type="date"
                    value={overrideEnd}
                    onChange={(e) => setOverrideEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="override-reason-input" className="block text-xs font-semibold text-slate-700">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  id="override-reason-input"
                  rows={3}
                  placeholder="e.g. Granted courtesy extension following ticket #5102"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOverrideTarget(null)}
                  disabled={isOverriding}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isOverriding}>
                  Apply Override
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
