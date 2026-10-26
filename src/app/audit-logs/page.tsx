'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { AuditLogItem } from '@/lib/api/types';
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

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter.trim() || undefined,
        targetType: targetTypeFilter.trim() || undefined,
      });
      setLogs(res.items);
      setPagination(res.pagination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, targetTypeFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <AdminShell title="Platform Audit Trail">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Audit Logs
            </h1>
            <p className="text-sm text-slate-500">
              Immutable ledger of privileged operations, plan changes, suspensions, and promotion transitions.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Security Info */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-slate-900">
                Tamper-Evident Administrative Audit Trail
              </span>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                Entries are write-once records tied to authenticated admin sessions, IP addresses, and user-agents. Passwords, session cookies, and payment secrets are automatically filtered before persistence.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center"
        >
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Filter by action (e.g. business.suspended)..."
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Filter by target (e.g. Business, Plan)..."
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 px-4 text-xs">
            Filter Logs
          </Button>
        </form>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchLogs(1)}>
              Retry
            </Button>
          </div>
        )}

        {/* Audit Log Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Type & ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-500">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No audit records match the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(l.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-slate-900">
                      {l.actorEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {l.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <span className="font-semibold">{l.targetType}</span>
                      {l.targetId ? ` (${l.targetId})` : ''}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {l.ipAddress || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(l)}
                        className="h-8 px-2 text-slate-600 hover:text-indigo-600"
                        title="Inspect Metadata"
                      >
                        <Eye className="h-4 w-4" />
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
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(pagination.page + 1)}
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

        {/* Audit Log Inspection Dialog */}
        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-indigo-600" />
                <span>Audit Log Entry Details</span>
              </DialogTitle>
              <DialogDescription>
                Event recorded at {selectedLog ? formatDate(selectedLog.createdAt) : ''}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                  <div>
                    <span className="text-slate-500 block">Administrator</span>
                    <span className="font-semibold text-slate-900">{selectedLog.actorEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Action</span>
                    <Badge variant="secondary" className="font-mono text-[10px] mt-0.5">
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Type</span>
                    <span className="font-medium text-slate-800">{selectedLog.targetType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Identifier</span>
                    <span className="font-mono text-slate-700">{selectedLog.targetId || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IP Address</span>
                    <span className="font-mono text-slate-700">{selectedLog.ipAddress || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">User-Agent</span>
                    <span className="truncate block text-slate-700 max-w-[180px]" title={selectedLog.userAgent || ''}>
                      {selectedLog.userAgent || '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700 block">Operation Metadata / Payload Diff</span>
                  <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100">
                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
