import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PromotionsPage from '@/app/promotions/page';
import { adminApi } from '@/lib/api/admin';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/promotions',
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
    getPromotions: vi.fn(),
    pausePromotion: vi.fn(),
    resumePromotion: vi.fn(),
    retirePromotion: vi.fn(),
  },
}));

describe('Promotions Lifecycle Page', () => {
  const mockPromotions = [
    {
      code: 'FREE4YOU',
      name: 'FREE4YOU Lifetime Promotion',
      description: 'Lifetime-free promotional access for qualifying early users',
      status: 'active' as const,
      gracePeriodDays: 30,
      redeemedCount: 14,
      activeEntitlementsCount: 14,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FREE4YOU promotional lifecycle status and metrics', async () => {
    vi.mocked(adminApi.getPromotions).mockResolvedValue(mockPromotions);

    render(<PromotionsPage />);

    await waitFor(() => {
      expect(screen.getByText('FREE4YOU Lifetime Promotion')).toBeInTheDocument();
      expect(screen.getByText('FREE4YOU')).toBeInTheDocument();
      expect(screen.getByText('Status: active')).toBeInTheDocument();
      expect(screen.getAllByText('14').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Pause Redemptions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retire Promotion/i })).toBeInTheDocument();
    });
  });

  it('opens retirement dialog with 30-day grace period and requires mandatory reason', async () => {
    vi.mocked(adminApi.getPromotions).mockResolvedValue(mockPromotions);
    vi.mocked(adminApi.retirePromotion).mockResolvedValueOnce({
      promotion: { ...mockPromotions[0], status: 'retired' },
      affectedAccountsCount: 14,
    });

    render(<PromotionsPage />);

    await waitFor(() => {
      expect(screen.getByText('FREE4YOU Lifetime Promotion')).toBeInTheDocument();
    });

    // Click Retire Promotion
    const retireBtn = screen.getByRole('button', { name: /Retire Promotion/i });
    fireEvent.click(retireBtn);

    await waitFor(() => {
      expect(screen.getByText(/Retire Promotion Program: FREE4YOU/i)).toBeInTheDocument();
      expect(screen.getByText(/Affected Accounts: 14 businesses/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Migration \/ Grace Period/i)).toHaveValue(30);
    });

    // Enter reason
    const reasonInput = screen.getByLabelText(/Audit Reason for Retirement/i);
    fireEvent.change(reasonInput, {
      target: { value: 'Early promotional quota fulfilled; transitioning platform to paid packages.' },
    });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Retire Promotion Program/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminApi.retirePromotion).toHaveBeenCalledWith('FREE4YOU', {
        gracePeriodDays: 30,
        reason: 'Early promotional quota fulfilled; transitioning platform to paid packages.',
      });
    });
  });
});
