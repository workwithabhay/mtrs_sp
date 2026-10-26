import { apiFetch } from './client';
import type {
  AdminUser,
  PlatformOverview,
  BusinessListItem,
  BusinessDetail,
  SubscriptionListItem,
  PlanItem,
  PromotionItem,
  PaymentListItem,
  OperationsSummary,
  WebhookListItem,
  AuditLogItem,
  PaginatedResult,
} from './types';

export const adminApi = {
  // Authentication & Session
  async requestLoginOtp(email: string): Promise<{ message: string; cooldownSeconds: number }> {
    return apiFetch('/auth/login/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyLoginOtp(email: string, otp: string): Promise<{ user: AdminUser }> {
    return apiFetch('/auth/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  async getMe(): Promise<AdminUser> {
    return apiFetch('/admin/me');
  },

  async logout(): Promise<void> {
    await apiFetch('/auth/logout', { method: 'POST' });
  },

  // Overview
  async getOverview(): Promise<PlatformOverview> {
    return apiFetch('/admin/overview');
  },

  // Businesses
  async getBusinesses(params?: {
    page?: number;
    limit?: number;
    query?: string;
    status?: string;
  }): Promise<PaginatedResult<BusinessListItem>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.query) searchParams.set('query', params.query);
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);

    const queryStr = searchParams.toString();
    return apiFetch(`/admin/businesses${queryStr ? `?${queryStr}` : ''}`);
  },

  async getBusinessDetail(id: string): Promise<BusinessDetail> {
    return apiFetch(`/admin/businesses/${id}`);
  },

  async updateBusinessStatus(
    id: string,
    data: { status: 'active' | 'suspended'; reason: string },
  ): Promise<BusinessDetail> {
    return apiFetch(`/admin/businesses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Plans & Pricing
  async getPlans(): Promise<PlanItem[]> {
    return apiFetch('/admin/plans');
  },

  async createPlan(data: Partial<PlanItem>): Promise<PlanItem> {
    return apiFetch('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePlan(id: string, data: Partial<PlanItem>): Promise<PlanItem> {
    return apiFetch(`/admin/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Promotions & FREE4YOU Lifecycle
  async getPromotions(): Promise<PromotionItem[]> {
    return apiFetch('/admin/promotions');
  },

  async pausePromotion(code: string): Promise<PromotionItem> {
    return apiFetch(`/admin/promotions/${code}/pause`, {
      method: 'POST',
    });
  },

  async resumePromotion(code: string): Promise<PromotionItem> {
    return apiFetch(`/admin/promotions/${code}/resume`, {
      method: 'POST',
    });
  },

  async retirePromotion(
    code: string,
    data: { gracePeriodDays: number; reason: string },
  ): Promise<{ promotion: PromotionItem; affectedAccountsCount: number }> {
    return apiFetch(`/admin/promotions/${code}/retire`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Subscriptions & Entitlements
  async getSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    planId?: string;
  }): Promise<PaginatedResult<SubscriptionListItem>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.planId) searchParams.set('planId', params.planId);

    const queryStr = searchParams.toString();
    return apiFetch(`/admin/subscriptions${queryStr ? `?${queryStr}` : ''}`);
  },

  async overrideSubscription(
    id: string,
    data: { currentPeriodEnd?: string; status?: string; reason: string },
  ): Promise<SubscriptionListItem> {
    return apiFetch(`/admin/subscriptions/${id}/override`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Payments & Transactions
  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    provider?: string;
    query?: string;
  }): Promise<PaginatedResult<PaymentListItem>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.provider && params.provider !== 'all') searchParams.set('provider', params.provider);
    if (params?.query) searchParams.set('query', params.query);

    const queryStr = searchParams.toString();
    return apiFetch(`/admin/payments${queryStr ? `?${queryStr}` : ''}`);
  },

  // Billing Operations & Webhooks
  async getBillingOperations(): Promise<OperationsSummary> {
    return apiFetch('/admin/operations/health');
  },

  async getWebhooks(params?: {
    page?: number;
    limit?: number;
    provider?: string;
    eventType?: string;
  }): Promise<PaginatedResult<WebhookListItem>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.provider) searchParams.set('provider', params.provider);
    if (params?.eventType) searchParams.set('eventType', params.eventType);

    const queryStr = searchParams.toString();
    return apiFetch(`/admin/operations/webhooks${queryStr ? `?${queryStr}` : ''}`);
  },

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
  }): Promise<PaginatedResult<AuditLogItem>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.action) searchParams.set('action', params.action);
    if (params?.targetType) searchParams.set('targetType', params.targetType);

    const queryStr = searchParams.toString();
    return apiFetch(`/admin/audit-logs${queryStr ? `?${queryStr}` : ''}`);
  },
};
