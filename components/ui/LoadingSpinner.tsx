'use client';

import React from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'orange' | 'white' | 'gray';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  fullPage?: boolean;
  label?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const colorClasses: Record<SpinnerColor, string> = {
  orange: 'border-[#FF6B35]/20 border-t-[#FF6B35]',
  white:  'border-white/30 border-t-white',
  gray:   'border-gray-200 border-t-gray-500',
};

export function LoadingSpinner({
  size = 'md',
  color = 'orange',
  className = '',
  fullPage = false,
  label,
}: LoadingSpinnerProps) {
  const spinner = (
    <span className="inline-flex flex-col items-center gap-2">
      <span
        role="status"
        aria-label={label ?? 'Loading...'}
        className={[
          'rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {label && (
        <span className="text-sm text-[#6B7280]">{label}</span>
      )}
    </span>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function PageLoader({ label = 'Yuklanmoqda...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <LoadingSpinner size="xl" />
      <p className="text-sm text-[#6B7280]">{label}</p>
    </div>
  );
}
