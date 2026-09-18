'use client'

interface DebtCardProps {
  debt: {
    id: string
    totalAmount: number
    paidAmount: number
    dueDate: string
    isPaid: boolean
    reminderCount: number
    lastReminderAt: string | null
    customer: { id: string; name: string; phone: string }
    order: { id: string }
  }
  onSendReminder: (debtId: string) => void
  onMarkPaid: (debtId: string) => void
  isLoading?: boolean
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' UZS'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('uz-UZ')
}

export default function DebtCard({ debt, onSendReminder, onMarkPaid, isLoading = false }: DebtCardProps) {
  const remaining = debt.totalAmount - debt.paidAmount
  const progressPct = debt.totalAmount > 0 ? (debt.paidAmount / debt.totalAmount) * 100 : 0
  const isOverdue = !debt.isPaid && new Date(debt.dueDate) < new Date()

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
      debt.isPaid ? 'border-green-200 opacity-75' : isOverdue ? 'border-red-200' : 'border-gray-100'
    }`}>
      <div className={`px-4 py-3 flex items-center justify-between ${
        debt.isPaid ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-[#FF6B35] font-bold text-xs">
              {debt.customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{debt.customer.name}</p>
            <a href={`tel:${debt.customer.phone}`} className="text-xs text-[#FF6B35]">
              {debt.customer.phone}
            </a>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          debt.isPaid ? 'bg-green-100 text-green-700' :
          isOverdue ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {debt.isPaid ? "To'langan" : isOverdue ? 'Muddati o\'tgan' : 'Faol'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Qolgan qarz</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(remaining)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Muddati</p>
            <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
              {formatDate(debt.dueDate)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>To'landi: {formatCurrency(debt.paidAmount)}</span>
            <span>Jami: {formatCurrency(debt.totalAmount)}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Buyurtma: #{debt.order.id.slice(-8).toUpperCase()}
          {debt.reminderCount > 0 && (
            <span className="ml-2">• {debt.reminderCount} eslatma yuborildi</span>
          )}
        </div>

        {!debt.isPaid && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onSendReminder(debt.id)}
              disabled={isLoading}
              className="flex-1 h-11 bg-orange-50 hover:bg-orange-100 text-[#FF6B35] font-semibold text-sm rounded-xl border border-orange-200 transition-colors disabled:opacity-50"
            >
              SMS Eslatma
            </button>
            <button
              onClick={() => onMarkPaid(debt.id)}
              disabled={isLoading}
              className="flex-1 h-11 bg-[#FF6B35] hover:bg-[#E55A24] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              To'landi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}