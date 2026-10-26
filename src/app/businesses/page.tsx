'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Building2,
  AlertCircle,
  Eye,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { BusinessListItem, BusinessDetail } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';
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

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Status Change (Suspend / Reactivate) Modal
  const [statusTargetBusiness, setStatusTargetBusiness] = useState<BusinessListItem | null>(null);
  const [targetNewStatus, setTargetNewStatus] = useState<'active' | 'suspended'>('suspended');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadBusinesses = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getBusinesses({
        page,
        limit: 10,
        query: searchQuery.trim() || undefined,
        status: statusFilter,
      });
      setBusinesses(res.items);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch businesses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadBusinesses(1);
  }, [loadBusinesses]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBusinesses(1);
  };

  const openBusinessDetail = async (id: string) => {
    setIsLoadingDetail(true);
    setShowDetailDialog(true);
    try {
      const detail = await adminApi.getBusinessDetail(id);
      setSelectedBusiness(detail);
    } catch {
      toast.error('Failed to load business details');
      setShowDetailDialog(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openStatusChangeDialog = (
    b: BusinessListItem,
    newStatus: 'active' | 'suspended',
  ) => {
    setStatusTargetBusiness(b);
    setTargetNewStatus(newStatus);
    setStatusReason('');
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTargetBusiness) return;
    if (!statusReason.trim() || statusReason.trim().length < 3) {
      toast.error('A detailed reason (at least 3 characters) is required for audit compliance.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await adminApi.updateBusinessStatus(statusTargetBusiness.id, {
        status: targetNewStatus,
        reason: statusReason.trim(),
      });
      toast.success(
        `Business "${statusTargetBusiness.name}" status updated to ${targetNewStatus}.`,
      );
      setStatusTargetBusiness(null);
      loadBusinesses(pagination.page);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminShell title="Business & Account Management">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Businesses</h1>
            <p className="text-sm text-slate-500">
              Manage accounts, investigate subscription statuses, and perform reversible suspensions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBusinesses(pagination.page)}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by business name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </form>

          <div className="flex items-center gap-3">
            <label htmlFor="status-filter" className="text-xs font-semibold text-slate-600">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending Verification</option>
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
            <Button variant="secondary" size="sm" onClick={() => loadBusinesses(1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Business Directory Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Entitlement / Plan</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-slate-500">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No businesses match the specified criteria.
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50/80">
                    <TableCell className="font-semibold text-slate-900">
                      {b.name}
                    </TableCell>
                    <TableCell className="text-slate-600">{b.category || 'General'}</TableCell>
                    <TableCell>
                      {b.owner ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-slate-900">{b.owner.name}</span>
                          <span className="text-slate-500">{b.owner.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No owner</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.subscriptionSummary ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-medium uppercase text-slate-800">
                            {b.subscriptionSummary.planId}
                          </span>
                          <span className="text-slate-400 capitalize">
                            {b.subscriptionSummary.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No active plan</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.status === 'active'
                            ? 'success'
                            : b.status === 'suspended'
                            ? 'destructive'
                            : 'warning'
                        }
                        className="capitalize"
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(b.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openBusinessDetail(b.id)}
                          className="h-8 px-2 text-slate-600 hover:text-indigo-600 cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {b.status === 'suspended' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStatusChangeDialog(b, 'active')}
                            className="h-8 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStatusChangeDialog(b, 'suspended')}
                            className="h-8 text-xs text-red-600 hover:bg-red-50 border-red-300"
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Toolbar */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6">
              <div className="text-xs text-slate-500">
                Showing Page <span className="font-semibold">{pagination.page}</span> of{' '}
                <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadBusinesses(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadBusinesses(pagination.page + 1)}
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

        {/* Business Details Drawer / Modal */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {isLoadingDetail ? 'Loading Business...' : selectedBusiness?.name}
              </DialogTitle>
              <DialogDescription>
                Detailed business record, branding configuration, and activity counters.
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetail ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : selectedBusiness ? (
              <div className="space-y-5 py-2 text-sm">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Category</span>
                    <span className="font-medium text-slate-800">{selectedBusiness.category}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Status</span>
                    <Badge
                      variant={selectedBusiness.status === 'active' ? 'success' : 'destructive'}
                      className="capitalize mt-0.5"
                    >
                      {selectedBusiness.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Owner Contact</span>
                    <span className="font-medium text-slate-800">
                      {selectedBusiness.owner?.name} ({selectedBusiness.owner?.email})
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Account Created</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(selectedBusiness.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Activity Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <span className="text-xs text-slate-500 block">QR Campaigns Created</span>
                    <span className="text-xl font-bold text-slate-900">
                      {selectedBusiness.stats.campaignsCount}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <span className="text-xs text-slate-500 block">Customer Reviews & Feedbacks</span>
                    <span className="text-xl font-bold text-slate-900">
                      {selectedBusiness.stats.feedbacksCount}
                    </span>
                  </div>
                </div>

                {/* Google Maps / Review Details */}
                <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Google Integration
                  </h4>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-800">Place ID:</span>{' '}
                      {selectedBusiness.googlePlaceId || 'Not connected'}
                    </p>
                    <p className="text-slate-600 truncate">
                      <span className="font-medium text-slate-800">Review URL:</span>{' '}
                      {selectedBusiness.googleReviewUrl || 'Not configured'}
                    </p>
                  </div>
                </div>

                {/* Branding Info */}
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: selectedBusiness.branding.primaryColor }}
                    />
                    <span>Primary: {selectedBusiness.branding.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: selectedBusiness.branding.secondaryColor }}
                    />
                    <span>Secondary: {selectedBusiness.branding.secondaryColor}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audited Account Suspension / Reactivation Dialog */}
        <Dialog
          open={Boolean(statusTargetBusiness)}
          onOpenChange={(open) => !open && setStatusTargetBusiness(null)}
        >
          <DialogContent>
            <DialogHeader>
              <div
                className={`flex items-center gap-2 ${
                  targetNewStatus === 'suspended' ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {targetNewStatus === 'suspended' ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <DialogTitle>
                  {targetNewStatus === 'suspended' ? 'Suspend Business Account' : 'Reactivate Business Account'}
                </DialogTitle>
              </div>
              <DialogDescription>
                {targetNewStatus === 'suspended'
                  ? `Suspending "${statusTargetBusiness?.name}" will restrict portal access. Customer QR scan links will display a suspension notice. Business data, reviews, and campaigns will remain intact.`
                  : `Reactivating "${statusTargetBusiness?.name}" will immediately restore portal login access and reactivate QR review campaigns.`}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmStatusChange} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="status-reason" className="block text-xs font-semibold text-slate-700">
                  Audit Reason (Required for Compliance) *
                </label>
                <textarea
                  id="status-reason"
                  rows={3}
                  placeholder={
                    targetNewStatus === 'suspended'
                      ? 'e.g. Terms violation, suspicious feedback generation, or client request'
                      : 'e.g. Investigation resolved, appeal granted, or invoice cleared'
                  }
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  This reason will be permanently recorded in the platform audit log alongside your administrator ID.
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusTargetBusiness(null)}
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={targetNewStatus === 'suspended' ? 'destructive' : 'primary'}
                  isLoading={isUpdatingStatus}
                >
                  {targetNewStatus === 'suspended' ? 'Confirm Suspension' : 'Confirm Reactivation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
