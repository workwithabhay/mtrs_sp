'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { adminApi } from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithOtp } = useAuth();

  const authorizedEmail = (
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'workwithabhaythakur@gmail.com'
  )
    .trim()
    .toLowerCase();

  const [email, setEmail] = useState(authorizedEmail);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // If already logged in as super admin, redirect to overview
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      router.push('/overview');
    }
  }, [user, router]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Please provide a valid administrator email address.');
      return;
    }

    if (normalizedEmail !== authorizedEmail) {
      setError(`Access restricted: Only ${authorizedEmail} is authorized for Super Admin access.`);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await adminApi.requestLoginOtp(email.trim().toLowerCase());
      setStep('otp');
      setCooldown(res.cooldownSeconds || 60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request login OTP';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await loginWithOtp(email.trim().toLowerCase(), otp.trim());
      router.push('/overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP code';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ReviewFlow Super Admin</h1>
          <p className="text-sm text-slate-400">Privileged Platform Operations & Security Portal</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-800/90 text-white shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-white">
              {step === 'email' ? 'Administrator Authentication' : 'Enter Verification Code'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 'email'
                ? 'Enter your provisioned super admin email to receive a one-time passcode.'
                : `A 6-digit verification code was dispatched to ${email}.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-950/50 p-3 text-xs text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-300">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@reviewflow.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                  isLoading={isLoading}
                >
                  Send Verification Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="admin-otp" className="block text-xs font-semibold text-slate-300">
                    6-Digit Security Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="admin-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoComplete="one-time-code"
                      className="pl-9 bg-slate-900 border-slate-700 text-white tracking-widest text-base placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                  isLoading={isLoading}
                >
                  Verify & Enter Control Panel
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setError(null);
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={cooldown > 0 || isLoading}
                    className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security Warning Notice */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/40 p-3.5 text-center text-xs text-slate-400">
          <p className="font-medium text-slate-300">Authorized Personnel Only</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Access to this system is monitored and restricted. All administrative sessions,
            data accesses, and plan overrides are cryptographically logged.
          </p>
        </div>
      </div>
    </div>
  );
}
