'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Loader2,
  Send,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  FileDown,
  Plus,
  Users,
  Store,
  History,
  X,
  Building2,
} from 'lucide-react'
import { generateCustomerStatementPDF } from '@/lib/pdfGenerator'

interface CashAccount {
  id: string
  name: string
  type: 'CASH' | 'BANK' | 'PERSON' | 'STORE'
  balance: number
  notes?: string | null
}

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  paymentMethod: string
  details?: string | null
  notes?: string | null
  createdAt: string
  account: { id: string; name: string; type: string }
  user?: { id: string; name: string; phone: string } | null
}

interface CustomerBalance {
  id: string
  name: string
  phone: string
  isWholesale: boolean
  balance: number
  totalDebt: number
  unpaidDebtsCount: number
  ordersCount: number
}

interface FinanceStats {
  totalRevenue: number
  cashRevenue: number
  creditRevenue: number
  totalDebt: number
  debtCount: number
  totalCashInAccounts?: number
  accounts?: CashAccount[]
}

function formatUZS(amount: number) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm"
}

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [customers, setCustomers] = useState<CustomerBalance[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'transactions'>('overview')
  const [message, setMessage] = useState('')
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)

  // Modallar
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false)
  const [txnType, setTxnType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Tranzaksiya form
  const [amount, setAmount] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [category, setCategory] = useState('ORDER_PAYMENT')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT'>('CASH')
  const [details, setDetails] = useState('')
  const [notes, setNotes] = useState('')

  // Kassa form
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<'CASH' | 'BANK' | 'STORE'>('CASH')
  const [newAccountNotes, setNewAccountNotes] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, accountsRes, custRes, txnRes] = await Promise.all([
        fetch('/api/finance/stats').then((r) => r.json()),
        fetch('/api/admin/finance/accounts').then((r) => r.json()),
        fetch('/api/admin/finance/customer-statement').then((r) => r.json()),
        fetch('/api/admin/finance/transactions?limit=30').then((r) => r.json()),
      ])

      setStats(statsRes)
      if (Array.isArray(accountsRes)) {
        setAccounts(accountsRes)
        if (!selectedAccount && accountsRes.length > 0) {
          setSelectedAccount(accountsRes[0].id)
        }
      }
      if (Array.isArray(custRes)) setCustomers(custRes)
      if (Array.isArray(txnRes)) setTransactions(txnRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedAccount])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Tranzaksiya topshirish (Kirim yoki Chiqim)
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0 || !selectedAccount) {
      alert('Iltimos summa va kassani tanlang')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: txnType,
          amount: Number(amount),
          accountId: selectedAccount,
          userId: selectedUser || null,
          category,
          paymentMethod,
          details,
          notes,
        }),
      })

      if (res.ok) {
        setIsTxnModalOpen(false)
        setAmount('')
        setDetails('')
        setNotes('')
        setSelectedUser('')
        setMessage(txnType === 'INCOME' ? 'Kirim muvaffaqiyatli saqlandi!' : 'Chiqim amalga oshirildi!')
        setTimeout(() => setMessage(''), 4000)
        await loadData()
      } else {
        const err = await res.json()
        alert(err.error || 'Xatolik yuz berdi')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setSubmitting(false)
    }
  }

  // Yangi kassa yaratish
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountName) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccountName,
          type: newAccountType,
          notes: newAccountNotes,
        }),
      })

      if (res.ok) {
        setIsAccountModalOpen(false)
        setNewAccountName('')
        setNewAccountNotes('')
        await loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  // PDF yuklab olish
  const handleDownloadPDF = async (userId: string) => {
    setPdfLoadingId(userId)
    try {
      const res = await fetch(`/api/admin/finance/customer-statement?userId=${userId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      generateCustomerStatementPDF(data)
    } catch {
      alert("PDF hisobotni yuklab olishda xatolik yuz berdi")
    } finally {
      setPdfLoadingId(null)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FF6B35]" size={36} />
      </div>
    )
  }

  const totalCash = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

  return (
    <div className="space-y-6 pb-20">
      {/* Sarlavha va Harakat Tugmalari */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Moliya & Kassa</h1>
          <p className="text-gray-500 text-sm">Kirim-chiqimlar, do'konlar va shaxslar balansi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTxnType('INCOME')
              setCategory('ORDER_PAYMENT')
              setIsTxnModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all"
          >
            <ArrowDownLeft size={16} />
            Kirim qilish
          </button>
          <button
            onClick={() => {
              setTxnType('EXPENSE')
              setCategory('SUPPLIER_PAYMENT')
              setIsTxnModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition-all"
          >
            <ArrowUpRight size={16} />
            Chiqim qilish
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold text-center">
          {message}
        </div>
      )}

      {/* Asosiy Bannerlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kassalardagi Jami Naqd / Bank Qoldig'i */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between opacity-85 text-xs mb-1">
            <span>Kassalardagi Jami Mablag'</span>
            <Wallet size={16} />
          </div>
          <p className="text-3xl font-black">{formatUZS(totalCash)}</p>
          <p className="text-xs opacity-75 mt-1">{accounts.length} ta faol kassa va hisoblar</p>
        </div>

        {/* Jami Nasiya (Qarz) */}
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#E55A24] rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between opacity-85 text-xs mb-1">
            <span>Jami Nasiya (Bizga qarz)</span>
            <CreditCard size={16} />
          </div>
          <p className="text-3xl font-black">{formatUZS(stats?.totalDebt || 0)}</p>
          <p className="text-xs opacity-75 mt-1">{stats?.debtCount || 0} ta nasiya xaridorlar</p>
        </div>

        {/* Jami Savdo / Tushum */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between opacity-85 text-xs mb-1">
            <span>Jami Tushum (Yopilgan buyurtmalar)</span>
            <TrendingUp size={16} />
          </div>
          <p className="text-3xl font-black">{formatUZS(stats?.totalRevenue || 0)}</p>
          <p className="text-xs opacity-75 mt-1">Naqd: {formatUZS(stats?.cashRevenue || 0)}</p>
        </div>
      </div>

      {/* Kassalar (Hisoblar) ro'yxati kartochkalari */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={18} className="text-[#FF6B35]" />
            Kassalar va Hisoblar
          </h2>
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> Yangi Kassa Qo'shish
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="card bg-white p-3.5 rounded-xl border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6B35]">
                  {acc.type}
                </span>
                <p className="font-bold text-gray-900 text-sm mt-1.5 truncate">{acc.name}</p>
                {acc.notes && <p className="text-xs text-gray-400 truncate">{acc.notes}</p>}
              </div>
              <p className="text-lg font-black text-gray-900 mt-2">{formatUZS(acc.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-500'
          }`}
        >
          Umumiy Holat & Nasiyalar
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'customers' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-500'
          }`}
        >
          <Store size={14} />
          Do'konlar va Shaxslar ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'transactions' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-500'
          }`}
        >
          <History size={14} />
          Kassa Jurnali (Kirim/Chiqim)
        </button>
      </div>

      {/* 1. UMUMIY HOLAT VA NASIYALAR TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="card bg-white p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-2">Nasiyaga Mahsulot Olganlar Ro'yxati</h3>
            <div className="divide-y divide-gray-100">
              {customers
                .filter((c) => c.totalDebt > 0)
                .map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.phone || '-'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black text-red-600">{formatUZS(c.totalDebt)}</p>
                        <p className="text-[11px] text-gray-400">{c.unpaidDebtsCount} ta ochiq nasiya</p>
                      </div>
                      <button
                        onClick={() => handleDownloadPDF(c.id)}
                        disabled={pdfLoadingId === c.id}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-[#FF6B35] text-[#FF6B35] text-xs font-bold flex items-center gap-1"
                      >
                        {pdfLoadingId === c.id ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
                        PDF
                      </button>
                    </div>
                  </div>
                ))}
              {customers.filter((c) => c.totalDebt > 0).length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">Hozirda faol nasiya qarzlar yo'q 🎉</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DO'KONLAR VA SHAXSLAR TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customers.map((c) => (
              <div key={c.id} className="card bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isWholesale ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.isWholesale ? 'Ulgurji Do\'kon (B2B)' : 'Xaridor'}
                    </span>
                    <p className="font-bold text-gray-900 text-base mt-1">{c.name}</p>
                    <a href={`tel:${c.phone}`} className="text-xs text-[#FF6B35] font-medium">{c.phone}</a>
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(c.id)}
                    disabled={pdfLoadingId === c.id}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B35] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {pdfLoadingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                    Akt-Sverka (PDF)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <span className="text-gray-400 block text-[11px]">Balans / Avans</span>
                    <span className={`font-bold text-sm ${c.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatUZS(c.balance)}
                    </span>
                  </div>
                  <div className="bg-red-50 p-2.5 rounded-lg">
                    <span className="text-red-500 block text-[11px]">Nasiya Qarzi</span>
                    <span className="font-bold text-sm text-red-600">{formatUZS(c.totalDebt)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedUser(c.id)
                      setTxnType('INCOME')
                      setCategory('ORDER_PAYMENT')
                      setDetails(`${c.name} hisobiga to'lov qabul qilindi`)
                      setIsTxnModalOpen(true)
                    }}
                    className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
                  >
                    + To'lov Qabul Qilish
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(c.id)
                      setTxnType('EXPENSE')
                      setCategory('OTHER')
                      setDetails(`${c.name} hisobidan qaytarish / xarajat`)
                      setIsTxnModalOpen(true)
                    }}
                    className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
                  >
                    - Chiqim Qilish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. KASSA JURNALI (TRANZAKSIYALAR) */}
      {activeTab === 'transactions' && (
        <div className="card bg-white p-4 rounded-xl border border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Oxirgi Kirim va Chiqim Harakatlari</h3>
          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tx.type === 'INCOME' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">
                      {tx.user?.name ? tx.user.name : tx.account.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleString('uz-UZ')} &bull; {tx.details || tx.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{formatUZS(tx.amount)}
                  </p>
                  <span className="text-[10px] text-gray-400 block uppercase">{tx.paymentMethod}</span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-xs text-gray-400 py-6 text-center">Hali kirim yoki chiqimlar amalga oshirilmagan</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL: KIRIM / CHIQIM QILISH */}
      {isTxnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                {txnType === 'INCOME' ? (
                  <span className="text-green-600 flex items-center gap-1.5"><ArrowDownLeft size={20} /> Kassa Kirimi</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1.5"><ArrowUpRight size={20} /> Kassa Chiqimi</span>
                )}
              </h3>
              <button onClick={() => setIsTxnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Summa (so'mda) *</label>
                <input
                  type="number"
                  required
                  placeholder="Masalan: 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field w-full font-bold text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Qaysi Kassaga / Qaysi Kassadan *</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="input-field w-full"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Qoldiq: {formatUZS(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Do'kon yoki Shaxs (Mijoz)</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Umumiy (Hech qaysi shaxsga biriktirilmagan)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'Tel yoq'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">To'lov Turi</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="input-field w-full"
                  >
                    <option value="CASH">Naqd pul</option>
                    <option value="CREDIT">Karta / Nasiya hisobi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kategoriya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field w-full"
                  >
                    {txnType === 'INCOME' ? (
                      <>
                        <option value="ORDER_PAYMENT">Mahsulot to'lovi</option>
                        <option value="DEBT_PAYMENT">Qarz / Nasiya to'lash</option>
                        <option value="ADVANCE_PAYMENT">Oldindan avans</option>
                        <option value="OTHER">Boshqa kirim</option>
                      </>
                    ) : (
                      <>
                        <option value="SUPPLIER_PAYMENT">Ta'minotchi xarajati</option>
                        <option value="SALARY">Ish haqi</option>
                        <option value="RENT">Ijara / Kommunal</option>
                        <option value="OTHER">Boshqa chiqim</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mahsulot yoki Nasiya Tafsiloti (Necha metr / dona)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 80 metr ipak mato to'lovi yoki 25 ta yostiq avansi"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="input-field w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 rounded-xl font-bold text-base mt-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Tasdiqlash va Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: YANGI KASSA OCHISH */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Building2 size={20} className="text-[#FF6B35]" /> Yangi Kassa Qo'shish
              </h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kassa / Hisob nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Chorsu Filiali Kassasi yoki Oloy Do'kon"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="input-field w-full text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kassa Turi</label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as any)}
                  className="input-field w-full"
                >
                  <option value="CASH">Naqd kassa</option>
                  <option value="BANK">Bank hisobi</option>
                  <option value="STORE">Do'kon kassasi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Asosiy do'konga mas'ul kassa"
                  value={newAccountNotes}
                  onChange={(e) => setNewAccountNotes(e.target.value)}
                  className="input-field w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Kassani Ochish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}