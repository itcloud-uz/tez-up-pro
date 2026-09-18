'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  Clock,
  TrendingUp,
  AlertCircle,
  Package,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

interface AdminStats {
  totalOrders: number
  pendingApproval: number
  totalRevenue: number
  totalDebt: number
  pipeline: { stage: string; count: number }[]
  recentOrders: {
    id: string
    customer: string
    total: number
    status: string
    createdAt: string
  }[]
  lowStockMaterials: { id: string; name: string; stock: number; minStock: number }[]
}

const STAGE_COLORS: Record<string, string> = {
  RECEIVING: 'bg-blue-100 text-blue-700',
  CUTTING: 'bg-yellow-100 text-yellow-700',
  ASSEMBLY: 'bg-purple-100 text-purple-700',
  SEWING: 'bg-pink-100 text-pink-700',
  PACKAGING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-gray-500 mt-2 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
      })
      .catch(() => setError("Ma'lumotlarni yuklab bo'lmadi"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FF6B35]" size={36} />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-red-500" size={36} />
        <p className="text-gray-600">{error || "Ma'lumot topilmadi"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Umumiy holat</p>
      </div>

      {/* Stats grid */}
      <section>
        <h2 className="section-header">Asosiy ko'rsatkichlar</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={ShoppingCart}
            label="Jami buyurtmalar"
            value={stats.totalOrders.toString()}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Clock}
            label="Kutilmoqda"
            value={stats.pendingApproval.toString()}
            color="bg-yellow-50 text-yellow-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Jami daromad"
            value={formatUZS(stats.totalRevenue)}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={AlertCircle}
            label="Jami qarz"
            value={formatUZS(stats.totalDebt)}
            color="bg-red-50 text-red-600"
          />
        </div>
      </section>

      {/* Production pipeline */}
      <section>
        <h2 className="section-header">Ishlab chiqarish bosqichlari</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(stats.pipeline ?? []).map((p) => (
            <div key={p.stage} className="card text-center">
              <span
                className={`badge text-xs mb-2 ${
                  STAGE_COLORS[p.stage] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {p.stage}
              </span>
              <p className="text-3xl font-black text-gray-900">{p.count}</p>
              <p className="text-xs text-gray-500">partiya</p>
            </div>
          ))}
          {(stats.pipeline ?? []).length === 0 && (
            <div className="col-span-full text-center py-6 text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Faol partiyalar yo&apos;q</p>
            </div>
          )}
        </div>
      </section>

      {/* Low stock alert */}
      {(stats.lowStockMaterials ?? []).length > 0 && (
        <section>
          <h2 className="section-header flex items-center gap-2">
            <AlertTriangle size={18} />
            Kam qolgan materiallar
          </h2>
          <div className="space-y-2">
            {stats.lowStockMaterials.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-xs text-red-600">
                    Qoldi: {m.stock} (Min: {m.minStock})
                  </p>
                </div>
                <span className="badge bg-red-100 text-red-700">Kam</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section>
        <h2 className="section-header">Oxirgi buyurtmalar</h2>
        {stats.recentOrders.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Buyurtmalar yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="card flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{order.customer}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{formatUZS(order.total)}</p>
                  <span
                    className={`badge text-xs ${
                      STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}