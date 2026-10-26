import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginPage from '@/app/login/page';
import { AuthProvider } from '@/contexts/auth-context';
import { adminApi } from '@/lib/api/admin';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/login',
}));

vi.mock('@/lib/api/admin', () => ({
  adminApi: {
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
    requestLoginOtp: vi.fn().mockResolvedValue({ message: 'OTP sent', cooldownSeconds: 60 }),
    verifyLoginOtp: vi.fn(),
  },
}));

describe('Super Admin Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders administrator login form with email input and security notice', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    expect(screen.getByText('ReviewFlow Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrator Authentication')).toBeInTheDocument();
    expect(screen.getByLabelText(/Admin Email Address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Verification Code/i })).toBeInTheDocument();
    expect(screen.getByText(/Authorized Personnel Only/i)).toBeInTheDocument();
  });

  it('transitions to OTP verification step when valid email is submitted', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    const emailInput = screen.getByLabelText(/Admin Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'workwithabhaythakur@gmail.com' } });

    const submitBtn = screen.getByRole('button', { name: /Send Verification Code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminApi.requestLoginOtp).toHaveBeenCalledWith('workwithabhaythakur@gmail.com');
      expect(screen.getByText('Enter Verification Code')).toBeInTheDocument();
      expect(screen.getByLabelText(/6-Digit Security Passcode/i)).toBeInTheDocument();
    });
  });

  it('completes login and navigates to overview on successful OTP verification', async () => {
    vi.mocked(adminApi.verifyLoginOtp).mockResolvedValueOnce({
      user: {
        id: 'admin-1',
        email: 'workwithabhaythakur@gmail.com',
        name: 'Super Admin',
        role: 'super_admin',
      },
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    // Step 1: Email
    fireEvent.change(screen.getByLabelText(/Admin Email Address/i), {
      target: { value: 'workwithabhaythakur@gmail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Verification Code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/6-Digit Security Passcode/i)).toBeInTheDocument();
    });

    // Step 2: OTP
    fireEvent.change(screen.getByLabelText(/6-Digit Security Passcode/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify & Enter Control Panel/i }));

    await waitFor(() => {
      expect(adminApi.verifyLoginOtp).toHaveBeenCalledWith('workwithabhaythakur@gmail.com', '123456');
      expect(pushMock).toHaveBeenCalledWith('/overview');
    });
  });

  it('blocks unauthorized emails with an explicit access restriction message', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Admin Email Address/i), {
      target: { value: 'unauthorized@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Verification Code/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Only workwithabhaythakur@gmail.com is authorized for Super Admin access/i),
      ).toBeInTheDocument();
      expect(adminApi.requestLoginOtp).not.toHaveBeenCalled();
    });
  });
});
