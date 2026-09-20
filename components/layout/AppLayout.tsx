'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Factory,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User,
  Truck,
  ChevronRight,
  Settings,
} from 'lucide-react'

type Role = 'ADMIN' | 'EMPLOYEE' | 'COURIER'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/production', label: 'Ishlab chiqarish', icon: Factory },
    { href: '/admin/crm', label: 'CRM', icon: Users },
    { href: '/admin/orders', label: 'Buyurtmalar', icon: ShoppingBag },
    { href: '/admin/inventory', label: 'Ombor', icon: Package },
    { href: '/admin/finance', label: 'Moliya', icon: DollarSign },
    { href: '/admin/sms', label: 'SMS', icon: MessageSquare },
    { href: '/admin/settings', label: 'Sozlamalar', icon: Settings },
  ],
  EMPLOYEE: [
    { href: '/employee', label: 'Vazifalarim', icon: Factory },
  ],
  COURIER: [
    { href: '/courier', label: 'Yetkazib berish', icon: Truck },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  EMPLOYEE: 'Xodim',
  COURIER: 'Kurier',
}
const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
  COURIER: 'bg-green-100 text-green-700',
}

interface AppLayoutProps {
  children: React.ReactNode
  role: Role
  user: { name?: string | null; email?: string | null }
}

export default function AppLayout({ children, role, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const navItems = NAV_ITEMS[role] ?? []

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black">T</span>
          </div>
          <div>
            <p className="font-black text-gray-900 leading-none">
              Tez <span className="text-[#FF6B35]">Up</span> Pro
            </p>
            <p className="text-xs text-gray-400 mt-0.5">ERP System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={18} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {user.name || user.email || 'Foydalanuvchi'}
            </p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${
                active
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35]'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="font-medium text-sm">{label}</span>
              {active && <ChevronRight size={16} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Chiqish</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FF6B35] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">T</span>
            </div>
            <span className="font-black text-gray-900">
              Tez <span className="text-[#FF6B35]">Up</span> Pro
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}