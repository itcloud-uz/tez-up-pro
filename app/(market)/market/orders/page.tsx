'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

type OrderStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  product?: { name: string }
}

interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  createdAt: string
  deliveryAddress: string
  items: OrderItem[]
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'Tasdiqlash kutilmoqda',
  APPROVED: 'Tasdiqlandi',
  PROCESSING: 'Tayyorlanmoqda',
  SHIPPED: 'Yetkazilmoqda',
  DELIVERED: 'Yetkazildi',
  CANCELLED: 'Bekor qilindi',
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-100 text-blue-700 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-700 border-purple-200',
  SHIPPED: 'bg-orange-100 text-orange-700 border-orange-200',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

function formatUZS(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function SkeletonOrderCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 animate-pulse shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-28" />
      </div>
      <div className="h-5 bg-gray-200 rounded w-36" />
    </div>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Server xatosi: ${res.status}`)
      const data = await res.json()
      const list: Order[] = Array.isArray(data) ? data : data.orders ?? []
      setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">Mening buyurtmalarim</h1>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50"
          aria-label="Yangilash"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>{error}</span>
          <button
            onClick={() => fetchOrders()}
            className="ml-auto text-red-600 underline font-medium text-xs"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonOrderCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
          <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
            <ShoppingBag size={40} className="text-[#FF6B35]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Buyurtmalar yo&apos;q</h2>
            <p className="text-sm text-gray-500 mt-2">
              Hali birorta buyurtma bermagansiz
            </p>
          </div>
          <Link
            href="/market"
            className="px-8 h-12 bg-[#FF6B35] text-white rounded-2xl font-bold text-sm inline-flex items-center gap-2 hover:bg-[#E55A24] transition-colors"
          >
            <ShoppingBag size={18} />
            Xarid qilish
          </Link>
        </div>
      )}

      {/* Orders list */}
      {!loading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/market/orders/${order.id}`)}
              className="w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left group active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-gray-900">{formatUZS(order.totalAmount)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.items?.length ?? 0} ta mahsulot
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-[#FF6B35] transition-colors flex-shrink-0"
                />
              </div>

              {/* Delivery address preview */}
              {order.deliveryAddress && (
                <p className="text-xs text-gray-400 mt-2 truncate border-t border-gray-50 pt-2">
                  📍 {order.deliveryAddress}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  )
}