export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin';
}

export interface PlatformOverview {
  businesses: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
  };
  users: {
    total: number;
    businessOwners: number;
    superAdmins: number;
  };
  subscriptions: {
    total: number;
    active: number;
    pending: number;
    cancelled: number;
    expired: number;
  };
  revenue: {
    totalAmountMinor: number;
    currency: string;
    successfulTransactionsCount: number;
    isSimulated: boolean;
    note: string;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    actorEmail: string;
    targetType: string;
    targetId?: string | null;
    createdAt: string;
  }>;
}

export interface BusinessListItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'suspended' | 'pending_verification';
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  subscriptionSummary: {
    planId: string;
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    billingInterval: 'monthly' | 'yearly';
    currentPeriodEnd?: string | null;
  } | null;
  createdAt: string;
}

export interface BusinessDetail extends BusinessListItem {
  googleReviewUrl?: string | null;
  googlePlaceId?: string | null;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
  };
  stats: {
    campaignsCount: number;
    feedbacksCount: number;
  };
}

export interface SubscriptionListItem {
  id: string;
  businessId: string;
  businessName?: string;
  planId: string;
  planName?: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  billingInterval: 'monthly' | 'yearly';
  priceSnapshot: {
    amount: number;
    currency: string;
  };
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | null;
  createdAt: string;
}

export interface PlanItem {
  _id: string;
  planId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  isPublished: boolean;
  features: string[];
  limits: {
    maxCampaigns: number;
    maxMonthlyScans: number;
    aiAssistanceEnabled: boolean;
  };
  sortOrder: number;
  createdAt?: string;
}

export interface PromotionItem {
  code: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'retired';
  pausedAt?: string | null;
  retiredAt?: string | null;
  migrationDeadline?: string | null;
  gracePeriodDays: number;
  retirementReason?: string | null;
  redeemedCount: number;
  activeEntitlementsCount: number;
  createdAt: string;
}

export interface PaymentListItem {
  id: string;
  businessId: string;
  businessName?: string;
  provider: 'razorpay' | 'mock' | 'promo' | string;
  eventType: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  currency: string;
  paymentReference?: string | null;
  checkoutId?: string | null;
  isSimulated: boolean;
  createdAt: string;
}

export interface OperationsSummary {
  provider: string;
  isSimulated: boolean;
  totalWebhooks: number;
  processedWebhooks: number;
  failedWebhooks: number;
  failedPaymentsCount: number;
  pendingPaymentsCount: number;
}

export interface WebhookListItem {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  processed: boolean;
  processedAt?: string | null;
  error?: string | null;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}
