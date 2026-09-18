import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default async function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/market" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">T</span>
            </div>
            <span className="font-black text-gray-900 text-lg">
              Tez <span className="text-[#FF6B35]">Up</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/market/orders"
              className="text-gray-600 hover:text-[#FF6B35] text-sm font-medium transition-colors"
            >
              Buyurtmalarim
            </Link>
            <Link
              href="/market/checkout"
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-orange-50 transition-colors"
              aria-label="Savat"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom md:hidden">
        <div className="flex">
          <Link
            href="/market"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-[#FF6B35] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Bosh sahifa</span>
          </Link>
          <Link
            href="/market/orders"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-[#FF6B35] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium">Buyurtmalar</span>
          </Link>
          <Link
            href="/market/checkout"
            className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-[#FF6B35] transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-medium">Savat</span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  )
}