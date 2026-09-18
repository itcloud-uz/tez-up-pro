'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, Loader2, CreditCard, MapPin, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/lib/cartStore'

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME ?? 'Bank nomi'
const BANK_CARD = process.env.NEXT_PUBLIC_BANK_CARD ?? '0000 0000 0000 0000'
const BANK_HOLDER = process.env.NEXT_PUBLIC_BANK_HOLDER ?? 'Karta egasi'

function formatUZS(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

const DELIVERY_FEE = 15000

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, getTotalPrice } = useCartStore()

  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = getTotalPrice()
  const total = subtotal + DELIVERY_FEE

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setError("Yetkazib berish manzilini kiriting")
      return
    }
    if (items.length === 0) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          deliveryAddress: deliveryAddress.trim(),
          paymentType: 'CASH',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Server xatosi: ${res.status}`)
      }

      const data = await res.json()
      const orderId = data.id ?? data.order?.id ?? data.orderId

      clearCart()
      router.push(`/market/orders/${orderId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Buyurtmada xatolik yuz berdi'
      setError(msg)
      setLoading(false)
    }
  }

  // ─── Empty cart state ───
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
          <ShoppingBag size={40} className="text-[#FF6B35]" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">Savat bo&apos;sh</h2>
          <p className="text-sm text-gray-500 mt-2">
            Buyurtma berish uchun avval mahsulot tanlang
          </p>
        </div>
        <Link
          href="/market"
          className="inline-flex items-center gap-2 px-8 h-14 bg-[#FF6B35] text-white rounded-2xl font-bold text-base hover:bg-[#E55A24] transition-colors active:scale-95"
        >
          <ShoppingBag size={20} />
          Xarid qilish
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Back header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Orqaga"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-900">Buyurtma berish</h1>
      </div>

      {/* Cart items (readonly) */}
      <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">
            Tanlangan mahsulotlar ({items.length})
          </h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <li key={item.productId} className="px-4 py-3 flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    🧵
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.quantity} × {formatUZS(item.price)}
                </p>
              </div>

              {/* Subtotal */}
              <p className="text-sm font-bold text-[#FF6B35] flex-shrink-0">
                {formatUZS(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Delivery address */}
      <section className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <MapPin size={16} className="text-[#FF6B35]" />
          Yetkazib berish manzili
          <span className="text-red-500">*</span>
        </label>
        <textarea
          value={deliveryAddress}
          onChange={(e) => { setDeliveryAddress(e.target.value); setError('') }}
          placeholder="Shahar, ko'cha, uy raqami, kvartira..."
          rows={3}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] transition ${
            error && !deliveryAddress.trim()
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 bg-white'
          }`}
        />
        {error && !deliveryAddress.trim() && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
      </section>

      {/* Payment info card */}
      <section className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-[#FF6B35]" />
          <h2 className="font-bold text-gray-900 text-sm">To&apos;lov ma&apos;lumotlari</h2>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Bank</span>
            <span className="font-semibold text-gray-900">{BANK_NAME}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Karta</span>
            <span className="font-mono font-bold text-gray-900 tracking-wider">{BANK_CARD}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Egasi</span>
            <span className="font-semibold text-gray-900">{BANK_HOLDER}</span>
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-100 rounded-xl px-3 py-2 leading-relaxed">
          Iltimos, jami summani ushbu kartaga o&apos;tkazing va keyingi sahifada chekni yuklang.
        </p>
      </section>

      {/* Order summary */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
        <h2 className="font-bold text-gray-900 text-base">Buyurtma summasi</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Mahsulotlar</span>
            <span>{formatUZS(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Yetkazib berish</span>
            <span>{formatUZS(DELIVERY_FEE)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-bold text-gray-900 text-base">Jami</span>
            <span className="font-black text-[#FF6B35] text-xl">{formatUZS(total)}</span>
          </div>
        </div>
      </section>

      {/* General error */}
      {error && deliveryAddress.trim() && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Place order button */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading || items.length === 0}
        className="w-full h-14 bg-[#FF6B35] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-[#E55A24] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Yuborilmoqda...
          </>
        ) : (
          <>
            <ShoppingBag size={20} />
            Buyurtma berish — {formatUZS(total)}
          </>
        )}
      </button>

      {/* Bottom spacer for mobile nav */}
      <div className="h-4" />
    </div>
  )
}