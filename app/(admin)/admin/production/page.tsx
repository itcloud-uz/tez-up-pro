'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Loader2, X, ChevronRight, User } from 'lucide-react'

type Stage = 'ALL' | 'RECEIVING' | 'CUTTING' | 'ASSEMBLY' | 'SEWING' | 'PACKAGING' | 'COMPLETED'

interface Batch {
  id: string
  productName: string
  quantity: number
  stage: Exclude<Stage, 'ALL'>
  assignedEmployee?: string
  createdAt: string
  notes?: string
}

const STAGES: Stage[] = ['ALL', 'RECEIVING', 'CUTTING', 'ASSEMBLY', 'SEWING', 'PACKAGING', 'COMPLETED']
const STAGE_LABELS: Record<Stage, string> = {
  ALL: 'Barchasi',
  RECEIVING: 'Qabul',
  CUTTING: 'Kesish',
  ASSEMBLY: 'Yig\'ish',
  SEWING: 'Tikish',
  PACKAGING: 'Qadoqlash',
  COMPLETED: 'Tayyor',
}
const STAGE_COLORS: Record<string, string> = {
  RECEIVING: 'bg-blue-100 text-blue-700',
  CUTTING: 'bg-yellow-100 text-yellow-700',
  ASSEMBLY: 'bg-purple-100 text-purple-700',
  SEWING: 'bg-pink-100 text-pink-700',
  PACKAGING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
}
const STAGE_ORDER = ['RECEIVING', 'CUTTING', 'ASSEMBLY', 'SEWING', 'PACKAGING', 'COMPLETED']

function StageProgressBar({ stage }: { stage: string }) {
  const idx = STAGE_ORDER.indexOf(stage)
  const pct = ((idx + 1) / STAGE_ORDER.length) * 100
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{STAGE_LABELS[stage as Stage] || stage}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

interface NewBatchForm {
  productName: string
  quantity: string
  notes: string
}

export default function ProductionPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Stage>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewBatchForm>({ productName: '', quantity: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchBatches = useCallback(() => {
    setLoading(true)
    fetch('/api/production/batches')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.batches ?? []
        setBatches(
          list.map((b: any) => ({
            ...b,
            productName: b.productName ?? b.product?.name ?? 'Noma\'lum mahsulot',
            stage: b.stage ?? b.currentStage ?? 'RECEIVING',
            assignedEmployee:
              typeof b.assignedEmployee === 'object' && b.assignedEmployee !== null
                ? b.assignedEmployee.name
                : b.assignedEmployee,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchBatches() }, [fetchBatches])

  const filtered = filter === 'ALL' ? batches : batches.filter((b) => b.stage === filter)

  const pipelineCounts = STAGE_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = batches.filter((b) => b.stage === s).length
    return acc
  }, {})

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productName || !form.quantity) return
    setSubmitting(true)
    try {
      await fetch('/api/production/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName,
          quantity: parseInt(form.quantity),
          notes: form.notes,
        }),
      })
      setModalOpen(false)
      setForm({ productName: '', quantity: '', notes: '' })
      fetchBatches()
    } catch {}
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ishlab chiqarish</h1>
          <p className="text-gray-500 text-sm">{batches.length} ta partiya</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Yangi partiya
        </button>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STAGE_ORDER.map((s) => (
          <div key={s} className="card text-center py-2 px-2">
            <p className="text-2xl font-black text-gray-900">{pipelineCounts[s] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{STAGE_LABELS[s as Stage]}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Batch list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#FF6B35]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>Partiyalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((batch) => (
            <div key={batch.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base truncate">{batch.productName}</h3>
                  <p className="text-sm text-gray-500">{batch.quantity} dona</p>
                </div>
                <span className={`badge text-xs flex-shrink-0 ${STAGE_COLORS[batch.stage] || 'bg-gray-100 text-gray-700'}`}>
                  {STAGE_LABELS[batch.stage as Stage] || batch.stage}
                </span>
              </div>

              <StageProgressBar stage={batch.stage} />

              <div className="flex items-center justify-between">
                {batch.assignedEmployee ? (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <User size={14} />
                    <span>{batch.assignedEmployee}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Tayinlanmagan</span>
                )}
                <div className="flex items-center gap-2">
                  <button className="text-xs text-[#FF6B35] font-medium flex items-center gap-1 hover:underline">
                    Batafsil <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {batch.notes && (
                <p className="text-xs text-gray-400 italic">{batch.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Yangi partiya</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mahsulot nomi
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Masalan: Ko'ylak XL"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Miqdor (dona)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="100"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Izoh (ixtiyoriy)
                </label>
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
                Yaratish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}