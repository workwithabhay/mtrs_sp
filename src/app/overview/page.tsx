'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { PlatformOverview } from '@/lib/api/types';
import { formatCurrencyPaise, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function OverviewPage() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApi.getOverview();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch platform metrics';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <AdminShell title="Platform Overview">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Dashboard</h1>
            <p className="text-sm text-slate-500">
              Authoritative, real-time platform aggregates and audit operations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </Button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchOverview}>
              Retry
            </Button>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Businesses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registered Businesses
              </CardTitle>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {data?.businesses.total ?? 0}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-emerald-600">
                      {data?.businesses.active ?? 0} Active
                    </span>
                    <span>•</span>
                    <span className="font-medium text-amber-600">
                      {data?.businesses.pending ?? 0} Pending
                    </span>
                    <span>•</span>
                    <span className="font-medium text-red-600">
                      {data?.businesses.suspended ?? 0} Suspended
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Subscriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Entitlements
              </CardTitle>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {data?.subscriptions.active ?? 0}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>Total accounts: {data?.subscriptions.total ?? 0}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {data?.subscriptions.expired ?? 0} Expired
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Platform Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Users
              </CardTitle>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {data?.users.total ?? 0}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <span>{data?.users.businessOwners ?? 0} Owners</span>
                    <span>•</span>
                    <span className="font-medium text-indigo-600">
                      {data?.users.superAdmins ?? 0} Super Admins
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Gross Verified Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Verified Transactions
              </CardTitle>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrencyPaise(data?.revenue.totalAmountMinor ?? 0, data?.revenue.currency)}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {data?.revenue.successfulTransactionsCount ?? 0} verified successful events
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/businesses"
            className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Business Directory</h4>
                  <p className="text-xs text-slate-500">Search accounts, manage status & suspension</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </a>

          <a
            href="/promotions"
            className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">FREE4YOU Lifecycle</h4>
                  <p className="text-xs text-slate-500">Pause, resume, or retire lifetime access</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </a>

          <a
            href="/audit-logs"
            className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Audit Trail</h4>
                  <p className="text-xs text-slate-500">Immutable log of all administrative operations</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </a>
        </div>

        {/* Recent Platform Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent Privileged Actions
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Last 10 administrative activities recorded across the platform.
              </p>
            </div>
            <a
              href="/audit-logs"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View full audit log</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No recent administrative activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentActivity.map((act) => (
                  <div key={act.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {act.action}
                      </Badge>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{act.actorEmail}</span>
                        <span className="text-slate-400">
                          Target: {act.targetType} {act.targetId ? `(${act.targetId})` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-400">{formatDate(act.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
