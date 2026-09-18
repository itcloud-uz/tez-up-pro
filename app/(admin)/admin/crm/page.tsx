'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Loader2, X, Phone, Mail, Globe } from 'lucide-react'

interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  source?: string
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST'
  notes?: string
  createdAt: string
}

const STATUSES: Lead['status'][] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']
const STATUS_LABELS: Record<Lead['status'], string> = {
  NEW: 'Yangi',
  CONTACTED: "Bog'landi",
  QUALIFIED: 'Sifatli',
  PROPOSAL: 'Taklif',
  WON: 'Muvaffaqiyatli',
  LOST: "Yo'qotildi",
}
const STATUS_COLORS: Record<Lead['status'], string> = {
  NEW: 'bg-blue-50 border-blue-200',
  CONTACTED: 'bg-yellow-50 border-yellow-200',
  QUALIFIED: 'bg-purple-50 border-purple-200',
  PROPOSAL: 'bg-orange-50 border-orange-200',
  WON: 'bg-green-50 border-green-200',
  LOST: 'bg-gray-50 border-gray-200',
}
const STATUS_BADGE: Record<Lead['status'], string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  QUALIFIED: 'bg-purple-100 text-purple-700',
  PROPOSAL: 'bg-orange-100 text-orange-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-gray-100 text-gray-700',
}

const WEBHOOK_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/crm`
    : '/api/webhooks/crm'

interface LeadForm {
  name: string
  phone: string
  email: string
  source: string
  notes: string
  status: Lead['status']
}

function LeadCard({
  lead,
  onUpdate,
}: {
  lead: Lead
  onUpdate: (id: string, status: Lead['status']) => void
}) {
  return (
    <div className={`rounded-xl border p-3 mb-2 ${STATUS_COLORS[lead.status]}`}>
      <p className="font-semibold text-gray-900 text-sm">{lead.name}</p>
      {lead.phone && (
        <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Phone size={11} />
          {lead.phone}
        </a>
      )}
      {lead.email && (
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <Mail size={11} />
          {lead.email}
        </p>
      )}
      {lead.source && (
        <p className="flex items-center gap-1 text-xs text-gray-400">
          <Globe size={11} />
          {lead.source}
        </p>
      )}
      {lead.notes && (
        <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">{lead.notes}</p>
      )}
      <div className="mt-2">
        <select
          value={lead.status}
          onChange={(e) => onUpdate(lead.id, e.target.value as Lead['status'])}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function KanbanColumn({
  status,
  leads,
  onUpdate,
}: {
  status: Lead['status']
  leads: Lead[]
  onUpdate: (id: string, status: Lead['status']) => void
}) {
  return (
    <div className="flex-shrink-0 w-64 bg-gray-50 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-3">
        <span className={`badge text-xs font-semibold ${STATUS_BADGE[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400 font-medium">{leads.length}</span>
      </div>
      <div className="min-h-[120px]">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  )
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<LeadForm>({
    name: '',
    phone: '',
    email: '',
    source: '',
    notes: '',
    status: 'NEW',
  })
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchLeads = useCallback(() => {
    setLoading(true)
    fetch('/api/crm/leads')
      .then((r) => r.json())
      .then((data) => setLeads(Array.isArray(data) ? data : data.leads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleUpdateStatus = async (id: string, status: Lead['status']) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    await fetch(`/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    setSubmitting(true)
    try {
      await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setModalOpen(false)
      setForm({ name: '', phone: '', email: '', source: '', notes: '', status: 'NEW' })
      fetchLeads()
    } catch {}
    finally { setSubmitting(false) }
  }

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const groupedLeads = STATUSES.reduce<Record<Lead['status'], Lead[]>>((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s)
    return acc
  }, {} as Record<Lead['status'], Lead[]>)

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">CRM</h1>
          <p className="text-gray-500 text-sm">{leads.length} ta mijoz</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Qo'shish
        </button>
      </div>

      {/* Webhook URL */}
      <div className="card bg-orange-50 border-orange-100">
        <p className="text-xs font-semibold text-orange-700 mb-1">Webhook manzili</p>
        <p className="text-xs text-gray-600 mb-2">
          Ijtimoiy tarmoqlar integratsiyasi uchun ushbu URL ni ulaning:
        </p>
        <div className="flex gap-2">
          <code className="flex-1 text-xs bg-white border border-orange-200 rounded-lg px-3 py-2 text-gray-700 truncate">
            {WEBHOOK_URL}
          </code>
          <button
            onClick={copyWebhook}
            className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
              copied ? 'bg-green-500 text-white' : 'bg-[#FF6B35] text-white'
            }`}
          >
            {copied ? 'Nusxalandi!' : 'Nusxa'}
          </button>
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
        </div>
      ) : (
        <div className="kanban-board -mx-4 px-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={groupedLeads[status]}
              onUpdate={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Add lead modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Yangi mijoz</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ism *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="To'liq ism"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+998901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manba</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Instagram, Telegram..."
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Holat</label>
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Lead['status'] })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Izoh</label>
                <textarea
                  className="input-field h-20 py-3 resize-none"
                  placeholder="Qo'shimcha ma'lumot..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}