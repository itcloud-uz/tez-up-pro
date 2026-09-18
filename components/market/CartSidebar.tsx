'use client'

import { useCartStore } from '@/lib/cartStore'
import { X, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

function formatUZS(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } = useCartStore()
  const total = getTotalPrice()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeCart}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#FF6B35]" />
            Savat ({items.length})
          </h2>
          <button
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ShoppingCart size={48} className="opacity-30 mb-3" />
              <p className="font-medium">Savat bo'sh</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">
                    👕
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-sm text-[#FF6B35] font-bold">{formatUZS(item.price)}</p>
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-[#FF6B35] text-gray-700 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-bold text-gray-900 min-w-[24px] text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-[#FF6B35] text-gray-700 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-4 space-y-3 safe-bottom">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Jami:</span>
              <span className="text-2xl font-black text-[#FF6B35]">{formatUZS(total)}</span>
            </div>
            <Link
              href="/market/checkout"
              onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2 text-center"
            >
              <ShoppingCart size={18} />
              Buyurtma berish
            </Link>
          </div>
        )}
      </div>
    </>
  )
}