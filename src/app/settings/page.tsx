'use client';

import React from 'react';
import {
  Terminal,
  LogOut,
  UserCheck,
  Lock,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <AdminShell title="Admin Settings & Security">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Profile & Security Controls
          </h1>
          <p className="text-sm text-slate-500">
            Current authenticated administrator identity, system policies, and bootstrap architecture.
          </p>
        </div>

        {/* Current Admin Account Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Authenticated Administrator</CardTitle>
                  <CardDescription>Your verified platform administrator profile</CardDescription>
                </div>
              </div>
              <Badge variant="success" className="text-xs">
                Active Session
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg bg-slate-50 p-4 text-xs">
              <div>
                <span className="text-slate-500 block">Administrator Name</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {user?.name || 'Super Admin'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {user?.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Role & Permissions</span>
                <span className="font-mono font-bold text-indigo-600 text-sm uppercase">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Session authenticated via verified email OTP with HTTP-only credentials.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>End Session</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Controlled Provisioning & Bootstrap Documentation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Initial Administrator Provisioning Workflow</CardTitle>
                <CardDescription>
                  Controlled server-side bootstrap mechanism for secure deployment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-700">
            <p className="leading-relaxed">
              In accordance with enterprise security requirements, this platform does{' '}
              <strong className="text-slate-900">not</strong> have any public Super Admin signup page or default hardcoded credentials. Super Admin accounts are provisioned exclusively through the controlled CLI command executed by platform operators in the backend server environment:
            </p>

            <div className="rounded-lg bg-slate-900 p-4 font-mono text-xs text-slate-100 space-y-2">
              <div className="text-slate-400"># Run in mtrs/backend directory:</div>
              <div className="text-emerald-400">
                npx tsx src/scripts/seed-admin.ts --email=admin@reviewflow.com --name=&quot;Super Admin&quot;
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="font-semibold text-slate-900 block mb-1">Idempotent & Repeat-Safe</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  If the user already exists, their account is elevated to super_admin without altering their existing credentials or history. If new, it creates an active verified admin.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="font-semibold text-slate-900 block mb-1">Zero Secret Logging</span>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  The script strictly logs userId and email only. No passwords, tokens, or OTP secrets are generated, exposed, or written to server logs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Architecture & Defense In Depth */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Security Boundaries & Controls</CardTitle>
                <CardDescription>
                  Production defense-in-depth measures protecting administrative endpoints
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="font-semibold text-slate-900 block">HTTP-Only Session Cookies</span>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                  Session tokens are strictly inaccessible to client JavaScript. Browser storage (localStorage/sessionStorage) is never used for authentication credentials.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="font-semibold text-slate-900 block">Double-Submit CSRF Defense</span>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                  Every state-changing mutation (POST/PATCH/DELETE) requires a matching x-csrf-token header validated by the backend.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <span className="font-semibold text-slate-900 block">Server-Side Role Checks</span>
                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                  Client route protection is cosmetic only. Backend middleware verifies session active state and super_admin role on every single administrative API call.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
