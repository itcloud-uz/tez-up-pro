'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Truck, PackageCheck, ChevronRight } from 'lucide-react'
import { ReceiptUpload } from '@/components/market/ReceiptUpload'

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
  product?: { name: string; imageUrl?: string; unit?: string }
}

interface Order {
  id: string
  status: OrderStatus
  totalAmount: number
  deliveryFee?: number
  createdAt: string
  updatedAt: string
  deliveryAddress: string
  receiptUrl?: string | null
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── Progress tracker ────────────────────────────────────────────────────────
const PROGRESS_STEPS: { key: OrderStatus; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'APPROVED', label: 'Tasdiqlandi', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Tayyorlanmoqda', icon: PackageCheck },
  { key: 'SHIPPED', label: 'Yetkazilmoqda', icon: Truck },
  { key: 'DELIVERED', label: 'Yetkazildi', icon: CheckCircle2 },
]

const STEP_ORDER: OrderStatus[] = ['APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

function ProgressTracker({ status }: { status: OrderStatus }) {
  const currentIdx = STEP_ORDER.indexOf(status)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Buyurtma holati</h3>
      <div className="flex items-center gap-0">
        {PROGRESS_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx
          const isActive = idx === currentIdx
          const isPending = idx > currentIdx
          const Icon = step.icon

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-[#FF6B35] text-white ring-4 ring-orange-100'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p
                  className={`text-[10px] font-medium text-center leading-tight max-w-[56px] ${
                    isActive ? 'text-[#FF6B35]' : isDone ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Connector */}
              {idx < PROGRESS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                    idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrder = useCallback(async (isRefresh = false) => {
    if (!orderId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
      if (!res.ok) {
        if (res.status === 404) throw new Error('Buyurtma topilmadi')
        throw new Error(`Server xatosi: ${res.status}`)
      }
      const data = await res.json()
      setOrder(data.order ?? data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  // ─── Receipt upload handler ──────────────────────────────────────
  const handleReceiptUpload = async (oId: string, file: File): Promise<void> => {
    const form = new FormData()
    form.append('receipt', file)
    const res = await fetch(`/api/orders/${oId}/receipt`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Yuklashda xatolik')
    }
    await fetchOrder(true)
  }

  // ─── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={36} className="animate-spin text-[#FF6B35]" />
      </div>
    )
  }

  // ─── Error ───────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center px-4">
        <XCircle size={48} className="text-red-400" />
        <div>
          <h2 className="text-lg font-black text-gray-900">Xatolik</h2>
          <p className="text-sm text-gray-500 mt-1">{error || 'Buyurtma topilmadi'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/market/orders')}
            className="px-5 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Orqaga
          </button>
          <button
            onClick={() => fetchOrder()}
            className="px-5 h-11 rounded-xl bg-[#FF6B35] text-white text-sm font-semibold hover:bg-[#E55A24] transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    )
  }

  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const deliveryFee = order.deliveryFee ?? 15000
  const grandTotal = order.totalAmount

  const showReceiptUpload =
    order.status === 'PENDING_APPROVAL' && !order.receiptUrl

  const showReceiptPreview =
    order.status === 'PENDING_APPROVAL' && !!order.receiptUrl

  const showProgressTracker =
    ['APPROVED', 'PROCESSING', 'SHIPPED'].includes(order.status)

  const showDelivered = order.status === 'DELIVERED'
  const showCancelled = order.status === 'CANCELLED'

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/market/orders')}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Orqaga"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-gray-900">
          Buyurtma #{order.id.slice(-8).toUpperCase()}
        </h1>
        <button
          onClick={() => fetchOrder(true)}
          disabled={refreshing}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-50"
          aria-label="Yangilash"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Order header card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        {order.updatedAt !== order.createdAt && (
          <p className="text-xs text-gray-400">
            Yangilandi: {formatDate(order.updatedAt)}
          </p>
        )}
      </div>

      {/* Status banners */}
      {showDelivered && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4">
          <CheckCircle2 size={28} className="text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-black text-emerald-800 text-base">
              Buyurtmangiz yetkazildi!
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Xarid uchun rahmat. Yana tashrif buyuring! 🎉
            </p>
          </div>
        </div>
      )}

      {showCancelled && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
          <XCircle size={28} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="font-black text-red-700 text-base">Buyurtma bekor qilindi</p>
            <p className="text-xs text-red-500 mt-0.5">
              Qo&apos;shimcha ma&apos;lumot uchun biz bilan bog&apos;laning
            </p>
          </div>
        </div>
      )}

      {/* Progress tracker */}
      {showProgressTracker && <ProgressTracker status={order.status} />}

      {/* Receipt upload */}
      {showReceiptUpload && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <ReceiptUpload
            orderId={order.id}
            totalAmount={grandTotal}
            onUpload={handleReceiptUpload}
          />
        </div>
      )}

      {/* Receipt preview (uploaded, awaiting approval) */}
      {showReceiptPreview && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Yuklangan chek</h3>
          <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
            <img
              src={order.receiptUrl!}
              alt="To'lov cheki"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
            <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Ko&apos;rib chiqilmoqda</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Admin to&apos;lovingizni tasdiqlash kutilmoqda. Bu 1–2 soat ichida bo&apos;ladi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-50">
          <h3 className="text-sm font-bold text-gray-900">
            Mahsulotlar ({order.items.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <li key={item.id} className="px-4 py-3 flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                {item.product?.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
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
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {item.product?.name ?? 'Mahsulot'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.quantity} × {formatUZS(item.unitPrice)}
                </p>
              </div>

              {/* Subtotal */}
              <p className="text-sm font-bold text-[#FF6B35] flex-shrink-0">
                {formatUZS(item.unitPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Delivery address */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Yetkazib berish manzili
        </p>
        <p className="text-sm text-gray-900 leading-relaxed">
          📍 {order.deliveryAddress}
        </p>
      </div>

      {/* Price summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-gray-900">Buyurtma summasi</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Mahsulotlar</span>
            <span>{formatUZS(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Yetkazib berish</span>
            <span>{formatUZS(deliveryFee)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-900">Jami</span>
            <span className="font-black text-[#FF6B35] text-xl">{formatUZS(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Back to orders */}
      <button
        onClick={() => router.push('/market/orders')}
        className="w-full h-12 flex items-center justify-center gap-2 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
      >
        <ArrowLeft size={16} />
        Barcha buyurtmalarga qaytish
      </button>
    </div>
  )
}