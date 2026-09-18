'use client';

import React from 'react';
import { signOut, useSession } from 'next-auth/react';

export interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] shadow-sm">
      {/* Orange accent line */}
      <div className="h-1 bg-[#FF6B35]" />

      <div className="flex items-center justify-between px-4 h-14">
        {/* Page title */}
        <h1 className="text-lg font-bold text-[#111827] truncate">{title}</h1>

        {/* User area */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Avatar — initials only (no image field in session) */}
          <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-[#FF6B35] flex items-center justify-center">
            <span className="text-xs font-bold text-[#FF6B35]">{initials}</span>
          </div>

          {/* Name (hidden on very small screens) */}
          <span className="hidden sm:block text-sm font-medium text-[#111827] max-w-[120px] truncate">
            {user?.name ?? 'Foydalanuvchi'}
          </span>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            aria-label="Chiqish"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-gray-100 hover:text-[#EF4444] active:bg-gray-200 transition-colors"
            title="Chiqish"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
