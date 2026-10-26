'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { adminApi } from '@/lib/api/admin';
import type { PlanItem } from '@/lib/api/types';
import { formatCurrencyPaise } from '@/lib/utils';
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

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    description: '',
    pricePaise: 9900,
    interval: 'monthly' as 'monthly' | 'yearly',
    isPublished: true,
    features: '',
    maxCampaigns: 5,
    maxMonthlyScans: 500,
    aiAssistanceEnabled: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApi.getPlans();
      setPlans(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load plans';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      planId: '',
      name: '',
      description: '',
      pricePaise: 9900,
      interval: 'monthly',
      isPublished: true,
      features: 'Unlimited QR Codes\nAdvanced Analytics\nAI Review Assistant',
      maxCampaigns: 5,
      maxMonthlyScans: 500,
      aiAssistanceEnabled: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: PlanItem) => {
    setEditingPlan(p);
    setFormData({
      planId: p.planId,
      name: p.name,
      description: p.description,
      pricePaise: p.price,
      interval: p.interval,
      isPublished: p.isPublished,
      features: (p.features || []).join('\n'),
      maxCampaigns: p.limits?.maxCampaigns || 5,
      maxMonthlyScans: p.limits?.maxMonthlyScans || 500,
      aiAssistanceEnabled: p.limits?.aiAssistanceEnabled ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.pricePaise < 0) {
      toast.error('Please provide a valid plan name and non-negative price.');
      return;
    }

    const featureList = formData.features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    if (featureList.length === 0) {
      toast.error('At least one feature is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        // Update existing plan
        await adminApi.updatePlan(editingPlan.planId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: formData.pricePaise,
          interval: formData.interval,
          isPublished: formData.isPublished,
          features: featureList,
          limits: {
            maxCampaigns: Number(formData.maxCampaigns),
            maxMonthlyScans: Number(formData.maxMonthlyScans),
            aiAssistanceEnabled: Boolean(formData.aiAssistanceEnabled),
          },
        });
        toast.success(`Plan "${formData.name}" updated successfully.`);
      } else {
        // Create new plan
        await adminApi.createPlan({
          planId: formData.planId.trim().toLowerCase(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: formData.pricePaise,
          interval: formData.interval,
          isPublished: formData.isPublished,
          features: featureList,
          limits: {
            maxCampaigns: Number(formData.maxCampaigns),
            maxMonthlyScans: Number(formData.maxMonthlyScans),
            aiAssistanceEnabled: Boolean(formData.aiAssistanceEnabled),
          },
        });
        toast.success(`New plan "${formData.name}" created successfully.`);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell title="Plans & Pricing Management">
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Commercial Plans</h1>
            <p className="text-sm text-slate-500">
              Manage subscription tiers, feature entitlements, pricing, and publication states.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPlans}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button size="sm" onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Plan</span>
            </Button>
          </div>
        </div>

        {/* Pricing Integrity Banner */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-indigo-950">
                Historical Pricing & Entitlement Safeguards Active
              </span>
              <p className="mt-0.5 leading-relaxed text-indigo-800">
                Modifications to plans apply solely to new subscriptions and renewals. All existing customer
                subscriptions retain immutable historical price snapshots and guaranteed terms.
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
            <Button variant="secondary" size="sm" onClick={fetchPlans}>
              Retry
            </Button>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : plans.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500">
              <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              No commercial plans found.
            </div>
          ) : (
            plans.map((p) => (
              <Card key={p._id || p.planId} className="flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={p.isPublished ? 'success' : 'secondary'}>
                        {p.isPublished ? 'Published' : 'Draft / Archived'}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400 uppercase">
                        ID: {p.planId}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2 text-slate-900">{p.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{p.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {formatCurrencyPaise(p.price, p.currency)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {p.interval}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Max Campaigns:</span>
                        <span className="font-semibold text-slate-900">
                          {p.limits?.maxCampaigns ?? 5}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Monthly Scans:</span>
                        <span className="font-semibold text-slate-900">
                          {p.limits?.maxMonthlyScans ?? 500}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>AI Feedback Assistant:</span>
                        <span className="font-semibold text-indigo-600">
                          {p.limits?.aiAssistanceEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                        Included Features
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {(p.features || []).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(p)}
                    className="w-full gap-2 text-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Plan</span>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Create / Edit Plan Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Commercial Plan'}
              </DialogTitle>
              <DialogDescription>
                Configure plan parameters, pricing, and system limits. Changes are logged and audited.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                {!editingPlan && (
                  <div className="space-y-1.5">
                    <label htmlFor="plan-id-input" className="block text-xs font-semibold text-slate-700">
                      Plan ID *
                    </label>
                    <Input
                      id="plan-id-input"
                      placeholder="e.g. quarterly-package"
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className={`space-y-1.5 ${editingPlan ? 'col-span-2' : ''}`}>
                  <label htmlFor="plan-name-input" className="block text-xs font-semibold text-slate-700">
                    Plan Name *
                  </label>
                  <Input
                    id="plan-name-input"
                    placeholder="e.g. Five-Month Package"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="plan-desc-input" className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <Input
                  id="plan-desc-input"
                  placeholder="e.g. 5 calendar months access with one-time payment"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="plan-price-input" className="block text-xs font-semibold text-slate-700">
                    Price (Paise / Minor Units) *
                  </label>
                  <Input
                    id="plan-price-input"
                    type="number"
                    min="0"
                    placeholder="39900 for ₹399"
                    value={formData.pricePaise}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePaise: Number(e.target.value) })
                    }
                    helperText={`Equivalent to ${formatCurrencyPaise(formData.pricePaise)}`}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="plan-interval-select" className="block text-xs font-semibold text-slate-700">
                    Billing Interval
                  </label>
                  <select
                    id="plan-interval-select"
                    value={formData.interval}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interval: e.target.value as 'monthly' | 'yearly',
                      })
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="plan-max-campaigns" className="block text-[11px] font-semibold text-slate-700">
                    Max Campaigns
                  </label>
                  <Input
                    id="plan-max-campaigns"
                    type="number"
                    min="1"
                    value={formData.maxCampaigns}
                    onChange={(e) =>
                      setFormData({ ...formData, maxCampaigns: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="plan-max-scans" className="block text-[11px] font-semibold text-slate-700">
                    Max Scans/mo
                  </label>
                  <Input
                    id="plan-max-scans"
                    type="number"
                    min="1"
                    value={formData.maxMonthlyScans}
                    onChange={(e) =>
                      setFormData({ ...formData, maxMonthlyScans: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="plan-ai-toggle" className="block text-[11px] font-semibold text-slate-700">
                    AI Feedback Assistant
                  </label>
                  <select
                    id="plan-ai-toggle"
                    value={formData.aiAssistanceEnabled ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aiAssistanceEnabled: e.target.value === 'true',
                      })
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="plan-features-input" className="block text-xs font-semibold text-slate-700">
                  Feature Bullets (One per line) *
                </label>
                <textarea
                  id="plan-features-input"
                  rows={3}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Unlimited QR Codes&#10;Google Place Integration&#10;Dedicated Support"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-published"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is-published" className="text-xs font-medium text-slate-700">
                  Published (Visible to prospective customers on the public pricing page)
                </label>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
