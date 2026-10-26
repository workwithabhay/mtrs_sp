'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { adminApi } from '@/lib/api/admin';
import type { AdminUser } from '@/lib/api/types';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  error: string | null;
  loginWithOtp: (email: string, otp: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const admin = await adminApi.getMe();
      if (admin && admin.role === 'super_admin') {
        setUser(admin);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithOtp = async (email: string, otp: string): Promise<AdminUser> => {
    setError(null);
    try {
      const result = await adminApi.verifyLoginOtp(email, otp);
      if (!result.user || result.user.role !== 'super_admin') {
        throw new Error('Access denied: You do not have Super Admin permissions.');
      }
      setUser(result.user);
      return result.user;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  // Route protection for privileged admin routes (everything except /login)
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginWithOtp,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
