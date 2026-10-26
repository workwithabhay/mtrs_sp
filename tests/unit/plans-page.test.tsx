import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import PlansPage from '@/app/plans/page';
import { adminApi } from '@/lib/api/admin';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/plans',
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@platform.com', role: 'super_admin' },
    isLoading: false,
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/api/admin', () => ({
  adminApi: {
    getPlans: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
  },
}));

describe('Plans & Commercial Pricing Page', () => {
  const mockPlans = [
    {
      _id: 'plan-1',
      planId: 'monthly',
      name: 'Monthly Pro Plan',
      description: 'Standard ₹99/month recurring plan',
      price: 9900,
      currency: 'INR',
      interval: 'monthly' as const,
      isPublished: true,
      features: ['Unlimited Campaigns', 'Full Analytics', 'AI Review Generator'],
      limits: { maxCampaigns: 5, maxMonthlyScans: 500, aiAssistanceEnabled: true },
      sortOrder: 1,
    },
    {
      _id: 'plan-2',
      planId: 'five-month',
      name: 'Five-Month Package',
      description: '₹399 for 5 calendar months non-recurring package',
      price: 39900,
      currency: 'INR',
      interval: 'monthly' as const,
      isPublished: true,
      features: ['5 Months Access', 'Dedicated Support'],
      limits: { maxCampaigns: 10, maxMonthlyScans: 1500, aiAssistanceEnabled: true },
      sortOrder: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders commercial plan cards with price, interval, and historical pricing safeguard banner', async () => {
    vi.mocked(adminApi.getPlans).mockResolvedValueOnce(mockPlans);

    render(<PlansPage />);

    await waitFor(() => {
      expect(screen.getByText('Commercial Plans')).toBeInTheDocument();
      expect(screen.getByText('Historical Pricing & Entitlement Safeguards Active')).toBeInTheDocument();
      expect(screen.getByText('Monthly Pro Plan')).toBeInTheDocument();
      expect(screen.getByText('Five-Month Package')).toBeInTheDocument();
      expect(screen.getByText('₹99')).toBeInTheDocument();
      expect(screen.getByText('₹399')).toBeInTheDocument();
    });
  });
});
