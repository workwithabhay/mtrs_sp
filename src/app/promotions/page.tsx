'use client';

import React, { useEffect, useState } from 'react';
import {
  Tag,
  Play,
  Pause,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { PromotionItem } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pause / Resume Confirmation
  const [pauseTarget, setPauseTarget] = useState<PromotionItem | null>(null);
  const [isPausing, setIsPausing] = useState(false);

  // Retirement Modal
  const [retireTarget, setRetireTarget] = useState<PromotionItem | null>(null);
  const [gracePeriodDays, setGracePeriodDays] = useState(30);
  const [retireReason, setRetireReason] = useState('');
  const [isRetiring, setIsRetiring] = useState(false);

  const fetchPromotions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApi.getPromotions();
      setPromotions(Array.isArray(result) ? result : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch promotions';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handlePause = async () => {
    if (!pauseTarget) return;
    setIsPausing(true);
    try {
      await adminApi.pausePromotion(pauseTarget.code);
      toast.success(
        `Promotion "${pauseTarget.code}" paused. New redemptions are now blocked; existing user entitlements remain active.`,
      );
      setPauseTarget(null);
      fetchPromotions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pause operation failed';
      toast.error(msg);
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async (promo: PromotionItem) => {
    try {
      await adminApi.resumePromotion(promo.code);
      toast.success(`Promotion "${promo.code}" resumed successfully.`);
      fetchPromotions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resume operation failed';
      toast.error(msg);
    }
  };

  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retireTarget) return;
    if (!retireReason.trim() || retireReason.trim().length < 3) {
      toast.error('A detailed business reason is mandatory for retirement.');
      return;
    }

    setIsRetiring(true);
    try {
      const res = await adminApi.retirePromotion(retireTarget.code, {
        gracePeriodDays,
        reason: retireReason.trim(),
      });
      toast.success(
        `Promotion "${retireTarget.code}" retired. Migration deadline established for ${res.affectedAccountsCount} affected accounts.`,
      );
      setRetireTarget(null);
      fetchPromotions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retirement failed';
      toast.error(msg);
    } finally {
      setIsRetiring(false);
    }
  };

  return (
    <AdminShell title="Promotion Lifecycle Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Promotional Codes & Lifecycle
            </h1>
            <p className="text-sm text-slate-500">
              Control the operational state of promotional entitlements with strict audit safeguards.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPromotions}
            disabled={isLoading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Business Rule Safeguard Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-amber-950">
                Critical Business Rules: Lifetime Free vs Paused vs Retired
              </span>
              <p className="leading-relaxed">
                <strong>Active:</strong> Eligible customers can redeem the code. Existing promotional entitlements remain valid.
              </p>
              <p className="leading-relaxed">
                <strong>Paused:</strong> Immediately halts new redemptions while{' '}
                <span className="underline font-medium">preserving all existing customer entitlements</span>.
                Pausing never revokes access from customers who previously redeemed.
              </p>
              <p className="leading-relaxed">
                <strong>Retired:</strong> Permanently closes the promotional program, enforces a grace period (default 30 days), and establishes an explicit migration workflow.
              </p>
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
            <Button variant="secondary" size="sm" onClick={fetchPromotions}>
              Retry
            </Button>
          </div>
        )}

        {/* Promotions List */}
        <div className="grid gap-6 sm:grid-cols-2">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))
          ) : !promotions || promotions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <Tag className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              No promotional programs configured.
            </div>
          ) : (
            promotions.map((promo) => (
              <Card key={promo.code} className="flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          promo.status === 'active'
                            ? 'success'
                            : promo.status === 'paused'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="capitalize"
                      >
                        Status: {promo.status}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {promo.code}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-3 text-slate-900">{promo.name}</CardTitle>
                    <CardDescription>{promo.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Redemptions</span>
                        <span className="text-lg font-bold text-slate-900">
                          {promo.redeemedCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Active Entitlements</span>
                        <span className="text-lg font-bold text-emerald-600">
                          {promo.activeEntitlementsCount}
                        </span>
                      </div>
                    </div>

                    {/* Status-specific details */}
                    {promo.status === 'paused' && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900">
                        <div className="flex items-center gap-2 font-medium">
                          <Pause className="h-4 w-4 text-amber-600" />
                          <span>Code is currently Paused</span>
                        </div>
                        <p className="mt-1 text-[11px] text-amber-800">
                          Paused on {formatDate(promo.pausedAt)}. Prospective customers cannot redeem this code. Existing redeemed accounts retain uninterrupted access.
                        </p>
                      </div>
                    )}

                    {promo.status === 'retired' && (
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs text-red-900 space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span>Code is Permanently Retired</span>
                        </div>
                        <p className="text-[11px] text-red-800">
                          <strong>Migration Deadline:</strong> {formatDate(promo.migrationDeadline)}
                        </p>
                        {promo.retirementReason && (
                          <p className="text-[11px] text-red-800">
                            <strong>Reason:</strong> {promo.retirementReason}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Action Controls */}
                <CardFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  {promo.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPauseTarget(promo)}
                        className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause Redemptions</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setRetireTarget(promo);
                          setGracePeriodDays(30);
                          setRetireReason('');
                        }}
                        className="gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Retire Promotion</span>
                      </Button>
                    </>
                  )}

                  {promo.status === 'paused' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResume(promo)}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume Code</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setRetireTarget(promo);
                          setGracePeriodDays(30);
                          setRetireReason('');
                        }}
                        className="gap-1.5"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Retire Promotion</span>
                      </Button>
                    </>
                  )}

                  {promo.status === 'retired' && (
                    <Badge variant="destructive" className="text-xs">
                      Promotion Terminated
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Pause Confirmation Dialog */}
        <Dialog open={Boolean(pauseTarget)} onOpenChange={(open) => !open && setPauseTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-600">
                <Pause className="h-5 w-5" />
                <DialogTitle>Pause Promotion: {pauseTarget?.code}</DialogTitle>
              </div>
              <DialogDescription>
                Pausing this code prevents any new businesses from redeeming it. Customers who have already
                redeemed this promotion will{' '}
                <strong className="text-slate-900">NOT lose their active entitlements</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setPauseTarget(null)} disabled={isPausing}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePause}
                isLoading={isPausing}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Confirm Pause
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Retirement Workflow Dialog */}
        <Dialog open={Boolean(retireTarget)} onOpenChange={(open) => !open && setRetireTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle>Retire Promotion Program: {retireTarget?.code}</DialogTitle>
              </div>
              <DialogDescription>
                Retiring a promotion is an explicit lifecycle event. It closes redemptions permanently and
                initiates a transition grace period for all existing accounts.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRetire} className="space-y-4 pt-2">
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-900 space-y-1">
                <p className="font-semibold">
                  Affected Accounts: {retireTarget?.redeemedCount ?? 0} businesses
                </p>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  During the grace period, users will receive operational notices to migrate to a standard
                  paid plan. No automatic recurring charges or card deductions will occur without consent.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="grace-days" className="block text-xs font-semibold text-slate-700">
                  Migration / Grace Period (Days) *
                </label>
                <Input
                  id="grace-days"
                  type="number"
                  min="1"
                  max="365"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  helperText={`Effective deadline: ${formatDate(
                    new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000),
                  )}`}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="retire-reason" className="block text-xs font-semibold text-slate-700">
                  Audit Reason for Retirement *
                </label>
                <textarea
                  id="retire-reason"
                  rows={3}
                  placeholder="e.g. Early promotional quota filled; migrating users to Monthly/5-Month packages"
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRetireTarget(null)}
                  disabled={isRetiring}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" isLoading={isRetiring}>
                  Retire Promotion Program
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
