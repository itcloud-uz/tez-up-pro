'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  MapPin,
  Phone,
  CheckCircle,
  Package,
  Navigation,
  Truck,
} from 'lucide-react'

interface Delivery {
  id: string
  orderId: string
  customerName: string
  customerPhone: string
  address: string
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED'
  items: { name: string; quantity: number }[]
  notes?: string
  createdAt: string
  deliveredAt?: string
  total: number
}

type Tab = 'active' | 'delivered'

const STATUS_COLORS: Record<Delivery['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}
const STATUS_LABELS: Record<Delivery['status'], string> = {
  PENDING: 'Kutilmoqda',
  IN_TRANSIT: "Yo'lda",
  DELIVERED: 'Yetkazildi',
  FAILED: "Yetkazilib bo'lmadi",
}

function formatUZS(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}

function DeliveryCard({
  delivery,
  onStart,
  onDeliver,
  updating,
}: {
  delivery: Delivery
  onStart: (id: string) => void
  onDeliver: (id: string) => void
  updating: boolean
}) {
  return (
    <div className="card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900 text-base">{delivery.customerName}</p>
          <span className={`badge text-xs mt-1 ${STATUS_COLORS[delivery.status]}`}>
            {STATUS_LABELS[delivery.status]}
          </span>
        </div>
        <p className="text-[#FF6B35] font-bold text-right">{formatUZS(delivery.total)}</p>
      </div>

      {/* Address */}
      <a
        href={`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 hover:bg-orange-50 transition-colors"
      >
        <MapPin size={16} className="text-[#FF6B35] flex-shrink-0 mt-0.5" />
        <span>{delivery.address}</span>
        <Navigation size={14} className="text-[#FF6B35] flex-shrink-0 ml-auto mt-0.5" />
      </a>

      {/* Items */}
      <div className="bg-gray-50 rounded-xl p-3">
        {delivery.items.map((item, i) => (
          <p key={i} className="text-sm text-gray-600">
            • {item.name} × {item.quantity}
          </p>
        ))}
      </div>

      {/* Notes */}
      {delivery.notes && (
        <p className="text-xs text-gray-400 italic">{delivery.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <a
          href={`tel:${delivery.customerPhone}`}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-[#FF6B35] text-[#FF6B35] font-semibold rounded-xl py-3 text-sm hover:bg-orange-50 transition-colors min-h-[44px]"
        >
          <Phone size={16} />
          Qo'ng'iroq
        </a>

        {delivery.status === 'PENDING' && (
          <button
            onClick={() => onStart(delivery.id)}
            disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors min-h-[44px] disabled:opacity-60"
          >
            {updating ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
            Boshlash
          </button>
        )}

        {delivery.status === 'IN_TRANSIT' && (
          <button
            onClick={() => onDeliver(delivery.id)}
            disabled={updating}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl py-3 text-sm transition-colors min-h-[44px] disabled:opacity-60"
          >
            {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Yetkazildi!
          </button>
        )}
      </div>

      {delivery.deliveredAt && (
        <p className="text-xs text-gray-400 text-center">
          Yetkazildi: {new Date(delivery.deliveredAt).toLocaleString('uz-UZ')}
        </p>
      )}
    </div>
  )
}

export default function CourierDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('active')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchDeliveries = useCallback(() => {
    setLoading(true)
    fetch('/api/courier/deliveries')
      .then((r) => r.json())
      .then((data) => setDeliveries(Array.isArray(data) ? data : data.deliveries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDeliveries() }, [fetchDeliveries])

  const handleStart = async (id: string) => {
    setUpdatingId(id)
    try {
      await fetch(`/api/courier/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_TRANSIT' }),
      })
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'IN_TRANSIT' } : d))
      )
    } catch {}
    finally { setUpdatingId(null) }
  }

  const handleDeliver = async (id: string) => {
    setUpdatingId(id)
    try {
      await fetch(`/api/courier/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'DELIVERED', deliveredAt: new Date().toISOString() } : d
        )
      )
    } catch {}
    finally { setUpdatingId(null) }
  }

  const active = deliveries.filter((d) => d.status === 'PENDING' || d.status === 'IN_TRANSIT')
  const delivered = deliveries.filter((d) => d.status === 'DELIVERED' || d.status === 'FAILED')
  const displayed = tab === 'active' ? active : delivered

  return (
    <div className="space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Yetkazib berish</h1>
        <p className="text-gray-500 text-sm">{active.length} ta faol buyurtma</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'active' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600'
          }`}
        >
          Faol
          {active.length > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${tab === 'active' ? 'bg-[#FF6B35] text-white' : 'bg-gray-200 text-gray-600'}`}>
              {active.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('delivered')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'delivered' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600'
          }`}
        >
          Yetkazilgan
          {delivered.length > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${tab === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {delivered.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
        </div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">
            {tab === 'active' ? "Faol yetkazib berish yo'q" : "Yetkazilgan buyurtmalar yo'q"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onStart={handleStart}
              onDeliver={handleDeliver}
              updating={updatingId === delivery.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}