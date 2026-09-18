'use client';

import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  header,
  footer,
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-xl border border-[#E5E7EB] shadow-sm',
        hoverable || onClick
          ? 'cursor-pointer transition-shadow duration-150 hover:shadow-md active:shadow-sm'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {header && (
        <div className="px-4 py-3 border-b border-[#E5E7EB] font-semibold text-[#111827]">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-[#E5E7EB] bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 border-b border-[#E5E7EB] font-semibold text-[#111827] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 border-t border-[#E5E7EB] bg-gray-50 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
}
