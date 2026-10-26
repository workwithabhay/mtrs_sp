import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import OverviewPage from '@/app/overview/page';
import { adminApi } from '@/lib/api/admin';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/overview',
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', email: 'admin@platform.com', name: 'Platform Admin', role: 'super_admin' },
    isLoading: false,
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/api/admin', () => ({
  adminApi: {
    getOverview: vi.fn(),
  },
}));

describe('Super Admin Overview Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders authoritatively aggregated platform KPI metrics and recent activity', async () => {
    vi.mocked(adminApi.getOverview).mockResolvedValueOnce({
      businesses: { total: 42, active: 38, suspended: 2, pending: 2 },
      users: { total: 45, businessOwners: 43, superAdmins: 2 },
      subscriptions: { total: 40, active: 35, pending: 2, cancelled: 1, expired: 2 },
      revenue: {
        totalAmountMinor: 1495000,
        currency: 'INR',
        successfulTransactionsCount: 28,
        isSimulated: true,
        note: 'Revenue includes only verified successful payment events.',
      },
      recentActivity: [
        {
          id: 'log-1',
          action: 'business.suspended',
          actorEmail: 'admin@platform.com',
          targetType: 'Business',
          targetId: 'biz-123',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(<OverviewPage />);

    // Check loading or resolution
    await waitFor(() => {
      expect(screen.getByText('System Dashboard')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText(/38 Active/i)).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('business.suspended')).toBeInTheDocument();
    });
  });

  it('displays error state with retry button on network failure', async () => {
    vi.mocked(adminApi.getOverview).mockRejectedValueOnce(new Error('Backend connection timeout'));

    render(<OverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Backend connection timeout')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
