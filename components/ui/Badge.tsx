'use client';

import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  error:   'bg-red-100 text-red-700 ring-red-200',
  info:    'bg-blue-100 text-blue-800 ring-blue-200',
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-gray-400',
};

export const statusVariantMap: Record<string, BadgeVariant> = {
  PENDING:    'warning',
  APPROVED:   'success',
  REJECTED:   'error',
  PROCESSING: 'info',
  COMPLETED:  'success',
  CANCELLED:  'error',
  DELIVERED:  'success',
  NEW:        'info',
  CONTACTED:  'warning',
  ORDERED:    'success',
  CLOSED:     'neutral',
  RECEIVING:  'info',
  CUTTING:    'warning',
  ASSEMBLY:   'warning',
  SEWING:     'warning',
  PACKAGING:  'info',
  PAID:       'success',
  UNPAID:     'error',
  OVERDUE:    'error',
  PARTIAL:    'warning',
};

export function Badge({ variant = 'neutral', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const variant: BadgeVariant = statusVariantMap[status.toUpperCase()] ?? 'neutral';
  return (
    <Badge variant={variant} dot className={className}>
      {status}
    </Badge>
  );
}
