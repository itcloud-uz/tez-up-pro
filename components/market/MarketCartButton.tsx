'use client'

import { useCartStore } from '@/lib/cartStore'
import { ShoppingCart } from 'lucide-react'

export default function MarketCartButton() {
  const { toggleCart, getTotalItems } = useCartStore()
  const count = getTotalItems()

  return (
    <button
      onClick={toggleCart}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-colors"
      aria-label="Savatni ochish"
    >
      <ShoppingCart size={22} className="text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-xs font-black rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}