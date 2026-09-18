'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Send, AlertCircle, TrendingUp, CreditCard } from 'lucide-react'

interface Debt {
  id: string
  customerName: string
  customerPhone: string
  amount: number
  dueDate?: string
  orderId: string
  reminderSent?: boolean
}

interface FinanceStats {
  totalRevenue: number
  cashRevenue: number
  creditRevenue: number
  totalDebt: number
  debtCount: number
  debts: Debt[]
}

function formatUZS(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}

function DebtCard({
  debt,
  onRemind,
}: {
  debt: Debt
  onRemind: (id: string) => void
}) {
  const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date()
  return (
    <div className={`card flex items-start justify-between gap-3 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{debt.customerName}</p>
        <a href={`tel:${debt.customerPhone}`} className="text-sm text-[#FF6B35]">
          {debt.customerPhone}
        </a>
        {debt.dueDate && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
            Muddat: {new Date(debt.dueDate).toLocaleDateString('uz-UZ')}
            {isOverdue && ' (Muddati o\'tgan!)'}
          </p>
        )}
        <p className="text-xl font-black text-[#FF6B35] mt-1">{formatUZS(debt.amount)}</p>
      </div>
      <button
        onClick={() => onRemind(debt.id)}
        disabled={debt.reminderSent}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          debt.reminderSent
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#FF6B35] text-white hover:bg-[#E55A24]'
        }`}
      >
        <Send size={14} />
        {debt.reminderSent ? 'Yuborildi' : 'SMS'}
      </button>
    </div>
  )
}

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingAll, setSendingAll] = useState(false)
  const [message, setMessage] = useState('')

  const fetchStats = useCallback(() => {
    setLoading(true)
    fetch('/api/finance/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setStats({
            totalRevenue: data.totalRevenue ?? 0,
            cashRevenue: data.cashRevenue ?? 0,
            creditRevenue: data.creditRevenue ?? 0,
            totalDebt: data.totalDebt ?? 0,
            debtCount: data.debtCount ?? 0,
            debts: Array.isArray(data.debts) ? data.debts : [],
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleRemind = async (debtId: string) => {
    await fetch(`/api/sms/send-reminder/${debtId}`, { method: 'POST' }).catch(() => {})
    setStats((prev) =>
      prev
        ? {
            ...prev,
            debts: (prev.debts ?? []).map((d) =>
              d.id === debtId ? { ...d, reminderSent: true } : d
            ),
          }
        : prev
    )
  }

  const handleSendAll = async () => {
    setSendingAll(true)
    try {
      await fetch('/api/sms/broadcast', { method: 'POST' })
      setMessage('Barcha qarzdorlarga SMS yuborildi!')
      setStats((prev) =>
        prev
          ? { ...prev, debts: (prev.debts ?? []).map((d) => ({ ...d, reminderSent: true })) }
          : prev
      )
      setTimeout(() => setMessage(''), 4000)
    } catch {
      setMessage('Xatolik yuz berdi')
    } finally {
      setSendingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FF6B35]" size={36} />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-red-500" size={36} />
        <p className="text-gray-600">Ma'lumotlarni yuklab bo'lmadi</p>
      </div>
    )
  }

  const cashPct = stats.totalRevenue > 0 ? (stats.cashRevenue / stats.totalRevenue) * 100 : 0
  const creditPct = stats.totalRevenue > 0 ? (stats.creditRevenue / stats.totalRevenue) * 100 : 0

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Moliya</h1>
        <p className="text-gray-500 text-sm">Umumiy moliyaviy holat</p>
      </div>

      {/* Total debt prominent */}
      <div className="bg-gradient-to-br from-[#FF6B35] to-[#E55A24] rounded-2xl p-6 text-white">
        <p className="text-sm opacity-80 mb-1">Jami qarz</p>
        <p className="text-4xl font-black">{formatUZS(stats.totalDebt)}</p>
        <p className="text-sm opacity-70 mt-1">{stats.debtCount} ta mijoz</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <TrendingUp size={20} className="text-green-500" />
          <p className="text-xs text-gray-500 mt-2">Jami daromad</p>
          <p className="text-lg font-black text-gray-900">{formatUZS(stats.totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <CreditCard size={20} className="text-blue-500" />
          <p className="text-xs text-gray-500 mt-2">Naqd</p>
          <p className="text-lg font-black text-gray-900">{formatUZS(stats.cashRevenue)}</p>
        </div>
      </div>

      {/* Cash vs Credit visualization */}
      <div className="card">
        <h2 className="section-header">To'lov taqsimoti</h2>
        <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
          <div
            className="bg-green-400 flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: `${cashPct}%` }}
          >
            {cashPct > 15 ? `${Math.round(cashPct)}%` : ''}
          </div>
          <div
            className="bg-[#FF6B35] flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: `${creditPct}%` }}
          >
            {creditPct > 15 ? `${Math.round(creditPct)}%` : ''}
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-green-400" />
            Naqd: {formatUZS(stats.cashRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
            Qarz: {formatUZS(stats.creditRevenue)}
          </div>
        </div>
      </div>

      {/* Success message */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm text-center">
          {message}
        </div>
      )}

      {/* Debts section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-header mb-0">Qarzlar</h2>
          {(stats.debts ?? []).length > 0 && (
            <button
              onClick={handleSendAll}
              disabled={sendingAll}
              className="flex items-center gap-2 bg-[#FF6B35] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#E55A24] transition-colors disabled:opacity-50"
            >
              {sendingAll ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Barchaga SMS
            </button>
          )}
        </div>
        {(stats.debts ?? []).length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <p>Qarzlar yo&apos;q 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(stats.debts ?? []).map((debt) => (
              <DebtCard key={debt.id} debt={debt} onRemind={handleRemind} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}