'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Loader2,
  X,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Search,
  CheckCircle,
  Clock,
  Send,
  UserCheck,
  ChevronRight,
  Share2,
  Trash2,
  Building,
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  source?: string
  status: 'NEW' | 'CONTACTED' | 'ORDERED' | 'CLOSED'
  notes?: string
  createdAt: string
}

const COLUMNS: Array<{ key: Lead['status']; label: string; color: string; badge: string; icon: any }> = [
  { key: 'NEW', label: 'Yangi (Target / Sayt)', color: 'border-blue-500 bg-blue-50/40', badge: 'bg-blue-100 text-blue-800', icon: Clock },
  { key: 'CONTACTED', label: 'Bog\'lanildi', color: 'border-yellow-500 bg-yellow-50/40', badge: 'bg-yellow-100 text-yellow-800', icon: Phone },
  { key: 'ORDERED', label: 'Buyurtma Berdi', color: 'border-green-500 bg-green-50/40', badge: 'bg-green-100 text-green-800', icon: CheckCircle },
  { key: 'CLOSED', label: 'Yakunlandi / Bekor', color: 'border-gray-400 bg-gray-50/50', badge: 'bg-gray-100 text-gray-700', icon: X },
]

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Drag & drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  // Yangi lead formasi
  const [form, setForm] = useState<{
    name: string
    phone: string
    email: string
    source: string
    notes: string
    status: Lead['status']
  }>({
    name: '',
    phone: '',
    email: '',
    source: 'FACEBOOK',
    notes: '',
    status: 'NEW',
  })

  const fetchLeads = useCallback(() => {
    setLoading(true)
    fetch('/api/crm/leads')
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : data.leads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Lead statusini yangilash
  const handleUpdateStatus = async (id: string, newStatus: Lead['status']) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)))
    try {
      await fetch(`/api/crm/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      fetchLeads()
    }
  }

  // Leadni o'chirish
  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu mijozni o'chirmoqchimisiz?")) return
    setLeads((prev) => prev.filter((l) => l.id !== id))
    try {
      await fetch(`/api/crm/leads/${id}`, { method: 'DELETE' })
    } catch {
      fetchLeads()
    }
  }

  // Yangi lead yaratish
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setModalOpen(false)
        setForm({ name: '', phone: '', email: '', source: 'FACEBOOK', notes: '', status: 'NEW' })
        fetchLeads()
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Drag and Drop funksiyalari
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id)
    e.dataTransfer.setData('text/plain', id)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const onDrop = (e: React.DragEvent, targetStatus: Lead['status']) => {
    e.preventDefault()
    const id = draggedLeadId || e.dataTransfer.getData('text/plain')
    if (id) {
      handleUpdateStatus(id, targetStatus)
      setDraggedLeadId(null)
    }
  }

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.name.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-5 pb-20">
      {/* Sarlavha & Amallar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">CRM Kanban Doskasi</h1>
          <p className="text-gray-500 text-sm">Target va ijtimoiy tarmoqlardan kelgan yangi mijozlar oqimi</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Mijoz qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 h-10 text-xs w-full"
            />
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center gap-1.5 px-4 h-10 text-xs font-bold whitespace-nowrap"
          >
            <Plus size={16} /> Yangi Mijoz
          </button>
        </div>
      </div>

      {/* KANBAN DOSKASI */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#FF6B35]" size={36} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.key)
            const Icon = col.icon

            return (
              <div
                key={col.key}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, col.key)}
                className={`rounded-2xl border-2 p-3 transition-colors ${col.color} min-h-[420px] flex flex-col`}
              >
                {/* Ustun boshlanishi */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={16} className="text-gray-700" />
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm">{col.label}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colLeads.length}
                  </span>
                </div>

                {/* Kartochkalar ro'yxati */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, lead.id)}
                      className="card bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                          title="O'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6B35] hover:underline"
                        >
                          <Phone size={12} />
                          {lead.phone}
                        </a>
                      )}

                      {lead.email && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Mail size={11} /> {lead.email}
                        </p>
                      )}

                      {lead.notes && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg italic text-[11px] line-clamp-3">
                          {lead.notes}
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Share2 size={11} /> {lead.source || 'Target'}
                        </span>
                        <span>{new Date(lead.createdAt).toLocaleDateString('uz-UZ')}</span>
                      </div>

                      {/* Tezkor status almashtirish (Mobil uchun) */}
                      <div className="pt-1 flex gap-1 sm:hidden">
                        {COLUMNS.filter((c) => c.key !== lead.status).map((targetCol) => (
                          <button
                            key={targetCol.key}
                            onClick={() => handleUpdateStatus(lead.id, targetCol.key)}
                            className="text-[10px] bg-gray-100 hover:bg-orange-50 hover:text-[#FF6B35] px-1.5 py-0.5 rounded font-medium"
                          >
                            &rarr; {targetCol.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 text-center p-3">
                      Bu bosqichda mijoz yo'q
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* YANGI MIJOZ QO'SHISH MODALI */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Yangi CRM Mijoz Qo'shish</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mijoz Ismi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Rahimov"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field w-full text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Telefon Raqami *</label>
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field w-full text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email (ixtiyoriy)</label>
                <input
                  type="email"
                  placeholder="mijoz@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Manba</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="input-field w-full text-xs"
                  >
                    <option value="FACEBOOK">Facebook Target</option>
                    <option value="INSTAGRAM">Instagram Reklama</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="MANUAL">Qo'lda kiritildi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Bosqich</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="input-field w-full text-xs"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Izoh / Qiziqqan mahsuloti</label>
                <textarea
                  placeholder="Masalan: 100 dona ko'ylak tikish bo'yicha narx so'radi"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field w-full text-xs h-20 py-2 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Mijozni Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}