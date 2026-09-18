'use client';

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-16 px-6 gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? (
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35]">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
        {description && (
          <p className="text-sm text-[#6B7280] max-w-xs">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
