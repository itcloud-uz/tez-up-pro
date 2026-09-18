'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { defaultNavItems, UserRole } from './MobileNav';

export interface SidebarProps {
  currentRole: UserRole;
}

export function Sidebar({ currentRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = defaultNavItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <aside
      className={[
        'hidden lg:flex flex-col h-screen sticky top-0 bg-white border-r border-[#E5E7EB] transition-all duration-200 z-30',
        collapsed ? 'w-16' : 'w-60',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#E5E7EB] shrink-0">
        <span className="text-[#FF6B35] font-bold text-xl leading-none">
          {collapsed ? 'T' : 'Tez Up Pro'}
        </span>
        {!collapsed && (
          <span className="ml-1 text-[10px] font-semibold text-[#6B7280] bg-orange-50 border border-orange-200 rounded px-1">
            ERP
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px]',
                'text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]',
                isActive
                  ? 'bg-orange-50 text-[#FF6B35]'
                  : 'text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]',
                collapsed ? 'justify-center' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={[
                  'shrink-0 flex items-center justify-center w-5 h-5',
                  isActive ? 'text-[#FF6B35]' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-[#FF6B35] text-white text-[10px] font-bold">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-[#E5E7EB] p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Kengaytirish' : 'Yig\'ish'}
          className={[
            'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px]',
            'text-sm font-medium text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]',
            collapsed ? 'justify-center' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <svg
            className={`w-5 h-5 shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Yig'ish</span>}
        </button>
      </div>
    </aside>
  );
}
