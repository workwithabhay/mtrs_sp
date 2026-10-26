'use client';

import React, { useState } from 'react';
import { Menu, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-8 backdrop-blur-md">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {title && <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>}
        </div>

        {/* Right: Admin Info & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-900">{user.name || user.email}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Super Admin
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutDialog(true)}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 gap-1.5"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle>Sign Out of Super Admin?</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to end your administrative session? You will need to request a new
              OTP to sign back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmLogout}
              isLoading={isLoggingOut}
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
