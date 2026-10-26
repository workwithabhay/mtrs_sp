import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BusinessesPage from '@/app/businesses/page';
import { adminApi } from '@/lib/api/admin';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/businesses',
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
    getBusinesses: vi.fn(),
    getBusinessDetail: vi.fn(),
    updateBusinessStatus: vi.fn(),
  },
}));

describe('Business Management Directory Page', () => {
  const mockBusinesses = [
    {
      id: 'biz-1',
      name: 'Champaran Handi & Fish Shop',
      category: 'Dining',
      status: 'active' as const,
      owner: { id: 'user-1', name: 'Ravi Kumar', email: 'ravi@example.com' },
      subscriptionSummary: {
        planId: 'monthly',
        status: 'active' as const,
        billingInterval: 'monthly' as const,
        currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders business directory table with real records and status badges', async () => {
    vi.mocked(adminApi.getBusinesses).mockResolvedValue({
      items: mockBusinesses,
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(<BusinessesPage />);

    await waitFor(() => {
      expect(screen.getByText('Champaran Handi & Fish Shop')).toBeInTheDocument();
      expect(screen.getByText('Dining')).toBeInTheDocument();
      expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
      expect(screen.getByText('ravi@example.com')).toBeInTheDocument();
      expect(screen.getByText('monthly')).toBeInTheDocument();
    });
  });

  it('opens suspension modal and submits required audit reason', async () => {
    vi.mocked(adminApi.getBusinesses).mockResolvedValue({
      items: mockBusinesses,
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(adminApi.updateBusinessStatus).mockResolvedValueOnce({
      ...mockBusinesses[0],
      status: 'suspended',
      branding: { primaryColor: '#2563EB', secondaryColor: '#1E293B' },
      stats: { campaignsCount: 2, feedbacksCount: 15 },
    });

    render(<BusinessesPage />);

    await waitFor(() => {
      expect(screen.getByText('Champaran Handi & Fish Shop')).toBeInTheDocument();
    });

    // Click Suspend button
    const suspendBtn = screen.getByRole('button', { name: /Suspend/i });
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      expect(screen.getByText('Suspend Business Account')).toBeInTheDocument();
    });

    // Fill audit reason
    const reasonInput = screen.getByLabelText(/Audit Reason/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Policy violation: artificial review generation suspected' },
    });

    // Confirm
    const confirmBtn = screen.getByRole('button', { name: /Confirm Suspension/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminApi.updateBusinessStatus).toHaveBeenCalledWith('biz-1', {
        status: 'suspended',
        reason: 'Policy violation: artificial review generation suspected',
      });
    });
  });
});
