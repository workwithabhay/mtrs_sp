import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrencyPaise(amountMinor: number, currency: string = 'INR'): string {
  const amountMajor = amountMinor / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMajor);
}

export function formatDate(dateStringOrDate: string | Date | null | undefined): string {
  if (!dateStringOrDate) return '—';
  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
