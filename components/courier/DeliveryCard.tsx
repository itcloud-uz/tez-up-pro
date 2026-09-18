'use client'
import { useState } from 'react'

interface DeliveryCardProps {
  delivery: {
    id: string
    deliveryAddress: string
    status: string
    scheduledAt: string | null
    deliveredAt: string | null
    createdAt: string
    order: {
      id: string
      totalAmount: number
      paymentType: string
      customer: { name: string; phone: string }
    }
  }
  onUpdateStatus: (deliveryId: string, status: 'IN_TRANSIT' | 'DELIVERED') => void
  isLoading?: boolean
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' UZS'
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Kutilmoqda', color: 'bg-gray-100 text-gray-700' },
  IN_TRANSIT: { label: 'Yo\'lda', color: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: 'Yetkazildi', color: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Bajarilmadi', color: 'bg-red-100 text-red-700' },
}

export default function DeliveryCard({ delivery, onUpdateStatus, isLoading = false }: DeliveryCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const statusInfo = statusConfig[delivery.status] ?? statusConfig.PENDING
  const isCompleted = delivery.status === 'DELIVERED' || delivery.status === 'FAILED'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
      delivery.status === 'DELIVERED' ? 'border-green-200' :
      delivery.status === 'IN_TRANSIT' ? 'border-blue-200' : 'border-gray-100'
    }`}>
      {/* Status strip */}
      <div className={`h-1 ${
        delivery.status === 'DELIVERED' ? 'bg-green-400' :
        delivery.status === 'IN_TRANSIT' ? 'bg-blue-400' :
        delivery.status === 'FAILED' ? 'bg-red-400' : 'bg-gray-300'
      }`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Buyurtma #{delivery.order.id.slice(-8).toUpperCase()}</p>
            <p className="font-bold text-gray-900">{delivery.order.customer.name}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
          <span className="text-lg mt-0.5">📍</span>
          <p className="text-sm text-gray-700 leading-relaxed">{delivery.deliveryAddress}</p>
        </div>

        {/* Order amount */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">To'lov:</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{formatCurrency(delivery.order.totalAmount)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              delivery.order.paymentType === 'CASH'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {delivery.order.paymentType === 'CASH' ? 'Naqd' : 'Nasiya'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="flex gap-2 pt-1">
            <a
              href={`tel:${delivery.order.customer.phone}`}
              className="flex items-center justify-center h-11 w-11 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
              aria-label="Call customer"
            >
              📞
            </a>

            {delivery.status === 'PENDING' && (
              <button
                onClick={() => onUpdateStatus(delivery.id, 'IN_TRANSIT')}
                disabled={isLoading}
                className="flex-1 h-11 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl border border-blue-200 transition-colors disabled:opacity-50"
              >
                Yo'lga chiqdim
              </button>
            )}

            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isLoading}
                className="flex-1 h-11 bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
              >
                Yetkazildi
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 h-11 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl"
                >
                  Bekor
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false)
                    onUpdateStatus(delivery.id, 'DELIVERED')
                  }}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Tasdiqlash
                </button>
              </div>
            )}
          </div>
        )}

        {delivery.status === 'DELIVERED' && delivery.deliveredAt && (
          <p className="text-xs text-center text-green-600 font-medium">
            Yetkazildi: {new Date(delivery.deliveredAt).toLocaleString('uz-UZ')}
          </p>
        )}
      </div>
    </div>
  )
}