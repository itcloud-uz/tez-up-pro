'use client';

import React from 'react';

export interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: {
    value: number; // e.g. 5 for +5%
    label?: string; // e.g. "vs last week"
  };
  className?: string;
  accentColor?: string;
}

export function StatsCard({
  icon,
  title,
  value,
  trend,
  className = '',
  accentColor = '#FF6B35',
}: StatsCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className={[
        'bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-col gap-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <span style={{ color: accentColor }} className="flex items-center justify-center">
            {icon}
          </span>
        </div>
        {trend !== undefined && (
          <span
            className={[
              'inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
              isPositive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {isPositive ? (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-[#6B7280] font-medium">{title}</p>
        <p className="text-2xl font-bold text-[#111827] mt-0.5 leading-none">{value}</p>
        {trend?.label && (
          <p className="text-xs text-[#6B7280] mt-1">{trend.label}</p>
        )}
      </div>
    </div>
  );
}
