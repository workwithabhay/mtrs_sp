'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Tag,
  ShieldCheck,
  ReceiptText,
  Activity,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Businesses', href: '/businesses', icon: Building2 },
  { label: 'Plans & Pricing', href: '/plans', icon: CreditCard },
  { label: 'Promotions (FREE4YOU)', href: '/promotions', icon: Tag },
  { label: 'Subscriptions', href: '/subscriptions', icon: ShieldCheck },
  { label: 'Payments & Transactions', href: '/payments', icon: ReceiptText },
  { label: 'Billing Operations', href: '/operations', icon: Activity },
  { label: 'Audit Logs', href: '/audit-logs', icon: FileText },
  { label: 'Admin Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-slate-100 transition-transform duration-200 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 font-bold text-white text-sm shadow-md">
              RF
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight text-sm">ReviewFlow</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-indigo-400">
                Super Admin
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/overview' && pathname === '/') ||
              pathname.startsWith(`${item.href}/`);

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Platform Status Badge at Bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="rounded-lg bg-slate-800/60 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-slate-200">System Healthy</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Environment: Production-ready</p>
          </div>
        </div>
      </aside>
    </>
  );
}
