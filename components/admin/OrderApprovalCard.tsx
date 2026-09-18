'use client'

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  product: { name: string }
}

interface Customer {
  name: string
  phone: string
}

interface OrderApprovalCardProps {
  order: {
    id: string
    customerId: string
    customer: Customer
    items: OrderItem[]
    totalAmount: number
    deliveryFee: number
    receiptUrl: string | null
    orderStatus: string
    createdAt: string
  }
  onApprove: (orderId: string) => void
  onReject: (orderId: string) => void
  isLoading?: boolean
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function OrderApprovalCard({
  order, onApprove, onReject, isLoading = false
}: OrderApprovalCardProps) {
  const receiptFullUrl = order.receiptUrl ? order.receiptUrl : null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Tasdiqlash kutilmoqda</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
          {formatDate(order.createdAt)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#FF6B35] font-bold text-sm">
              {order.customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{order.customer.name}</p>
            <a href={`tel:${order.customer.phone}`} className="text-sm text-[#FF6B35] hover:underline">
              {order.customer.phone}
            </a>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Buyurtma tarkibi</p>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.product.name} x {item.quantity}</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-900">Jami</span>
            <span className="text-base font-bold text-[#FF6B35]">
              {formatCurrency(order.totalAmount + order.deliveryFee)}
            </span>
          </div>
        </div>

        {receiptFullUrl ? (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">To`lov cheki</p>
            <a href={receiptFullUrl} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={receiptFullUrl}
                alt="Payment receipt"
                className="w-full h-48 object-contain bg-gray-100 rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
              />
              <p className="text-xs text-center text-[#FF6B35] mt-1">Kattalashtirish uchun bosing</p>
            </a>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-sm text-red-600">Chek yuklanmagan</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onReject(order.id)}
            disabled={isLoading}
            className="flex-1 h-12 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-200 transition-colors disabled:opacity-50"
          >
            Rad etish
          </button>
          <button
            onClick={() => onApprove(order.id)}
            disabled={isLoading || !receiptFullUrl}
            className="flex-1 h-12 bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  )
}