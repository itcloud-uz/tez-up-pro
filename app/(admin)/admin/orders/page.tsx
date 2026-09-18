'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Check, X, Loader2, ShoppingBag } from 'lucide-react'

type OrderStatus = 'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'DELIVERED' | 'CANCELLED'

interface Order {
  id: string
  customerName: string
  customerPhone: string
  total: number
  status: Exclude<OrderStatus, 'ALL'>
  paymentMethod: string
  items: { name: string; quantity: number; price: number }[]
  deliveryAddress: string
  createdAt: string
  receiptUrl?: string
}

const TABS: OrderStatus[] = ['ALL', 'PENDING_APPROVAL', 'APPROVED', 'DELIVERED']
const TAB_LABELS: Record<OrderStatus, string> = {
  ALL: 'Barchasi',
  PENDING_APPROVAL: "Ko'rib chiqish",
  APPROVED: 'Tasdiqlangan',
  DELIVERED: 'Yetkazilgan',
  CANCELLED: 'Bekor',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Ko'rib chiqilmoqda",
  APPROVED: 'Tasdiqlangan',
  PROCESSING: 'Jarayonda',
  SHIPPED: 'Yuborilgan',
  DELIVERED: 'Yetkazilgan',
  CANCELLED: 'Bekor qilingan',
}

function formatUZS(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}

function OrderCard({
  order,
  onApprove,
  onCancel,
}: {
  order: Order
  onApprove?: (id: string) => void
  onCancel?: (id: string) => void
}) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{order.customerName}</p>
          <a href={`tel:${order.customerPhone}`} className="text-sm text-[#FF6B35]">
            {order.customerPhone}
          </a>
        </div>
        <span className={`badge text-xs flex-shrink-0 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 space-y-1">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium text-gray-900">{formatUZS(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-bold text-gray-900">
          <span>Jami</span>
          <span className="text-[#FF6B35]">{formatUZS(order.total)}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>📍 {order.deliveryAddress}</p>
        <p>💳 {order.paymentMethod}</p>
        <p className="mt-1">{new Date(order.createdAt).toLocaleString('uz-UZ')}</p>
      </div>

      {order.receiptUrl && (
        <a
          href={order.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-[#FF6B35] underline"
        >
          Chekni ko'rish →
        </a>
      )}

      {order.status === 'PENDING_APPROVAL' && onApprove && onCancel && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onApprove(order.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            <Check size={16} />
            Tasdiqlash
          </button>
          <button
            onClick={() => onCancel(order.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            <X size={16} />
            Rad etish
          </button>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<OrderStatus>('ALL')
  const [search, setSearch] = useState('')

  const fetchOrders = useCallback(() => {
    setLoading(true)
    fetch('/api/orders')
      .then((r) => r.json())
      .then((res) => {
        const rawList = Array.isArray(res) ? res : res.data ?? res.orders ?? []
        setOrders(
          rawList.map((o: any) => ({
            id: o.id,
            customerName: o.customer?.name ?? 'Noma\'lum mijoz',
            customerPhone: o.customer?.phone ?? '',
            total: Number(o.totalAmount ?? o.total ?? 0),
            status: (o.orderStatus ?? o.status ?? 'PENDING_APPROVAL') as Exclude<OrderStatus, 'ALL'>,
            paymentMethod: o.paymentType === 'CASH' ? 'Naqd' : 'Qarz (Kredit)',
            items: Array.isArray(o.items)
              ? o.items.map((it: any) => ({
                  name: it.product?.name ?? it.name ?? 'Mahsulot',
                  quantity: Number(it.quantity ?? 1),
                  price: Number(it.unitPrice ?? it.price ?? 0),
                }))
              : [],
            deliveryAddress: o.delivery?.deliveryAddress ?? o.deliveryAddress ?? 'Manzil kiritilmagan',
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
            receiptUrl: o.receiptUrl ?? undefined,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleApprove = async (id: string) => {
    await fetch(`/api/orders/${id}/approve`, { method: 'POST' }).catch(() => {})
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'APPROVED' } : o))
    )
  }

  const handleCancel = async (id: string) => {
    await fetch(`/api/orders/${id}/cancel`, { method: 'POST' }).catch(() => {})
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' as Exclude<OrderStatus, 'ALL'> } : o))
    )
  }

  const filtered = orders.filter((o) => {
    const matchesTab = tab === 'ALL' || o.status === tab
    const matchesSearch =
      !search ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search)
    return matchesTab && matchesSearch
  })

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Buyurtmalar</h1>
        <p className="text-gray-500 text-sm">{orders.length} ta buyurtma</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map((t) => {
          const count = t === 'ALL' ? orders.length : orders.filter((o) => o.status === t).length
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {TAB_LABELS[t]}
              <span
                className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                  tab === t ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
          <p>Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onApprove={handleApprove}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}