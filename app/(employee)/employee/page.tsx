'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

interface Batch {
  id: string
  productName: string
  quantity: number
  stage: string
  notes?: string
  createdAt: string
}

const STAGE_ORDER = ['RECEIVING', 'CUTTING', 'ASSEMBLY', 'SEWING', 'PACKAGING', 'COMPLETED']
const STAGE_LABELS: Record<string, string> = {
  RECEIVING: 'Qabul qilish',
  CUTTING: 'Kesish',
  ASSEMBLY: "Yig'ish",
  SEWING: 'Tikish',
  PACKAGING: 'Qadoqlash',
  COMPLETED: 'Tayyor',
}
const STAGE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  RECEIVING: { bg: 'bg-blue-500', text: 'text-blue-500', icon: '📦' },
  CUTTING: { bg: 'bg-yellow-500', text: 'text-yellow-500', icon: '✂️' },
  ASSEMBLY: { bg: 'bg-purple-500', text: 'text-purple-500', icon: '🔧' },
  SEWING: { bg: 'bg-pink-500', text: 'text-pink-500', icon: '🪡' },
  PACKAGING: { bg: 'bg-indigo-500', text: 'text-indigo-500', icon: '📫' },
  COMPLETED: { bg: 'bg-green-500', text: 'text-green-500', icon: '✅' },
}

function StageProgress({ stage }: { stage: string }) {
  const idx = STAGE_ORDER.indexOf(stage)
  return (
    <div className="flex items-center gap-1 mt-3">
      {STAGE_ORDER.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div
            className={`h-2 rounded-full flex-1 transition-all ${
              i <= idx ? 'bg-[#FF6B35]' : 'bg-gray-200'
            }`}
          />
          {i < STAGE_ORDER.length - 1 && (
            <div className={`w-1 h-1 rounded-full mx-0.5 ${i < idx ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function BatchCard({
  batch,
  onAdvance,
  advancing,
}: {
  batch: Batch
  onAdvance: (id: string) => void
  advancing: boolean
}) {
  const color = STAGE_COLORS[batch.stage] || STAGE_COLORS.RECEIVING
  const isCompleted = batch.stage === 'COMPLETED'
  const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(batch.stage) + 1]

  return (
    <div className="card border-2 border-gray-100 overflow-hidden">
      {/* Colored top bar */}
      <div className={`-mx-4 -mt-4 mb-4 h-2 ${color.bg}`} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-3xl">{color.icon}</span>
          <h2 className="text-2xl font-black text-gray-900 mt-2 leading-tight">
            {batch.productName}
          </h2>
          <p className="text-4xl font-black text-[#FF6B35] mt-1">
            {batch.quantity}
            <span className="text-base font-semibold text-gray-500 ml-1">dona</span>
          </p>
        </div>
        {isCompleted && (
          <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={32} />
        )}
      </div>

      {/* Current stage badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${color.bg} bg-opacity-10`}>
        <span className={`w-2 h-2 rounded-full ${color.bg}`} />
        <span className={`font-bold text-base ${color.text}`}>
          {STAGE_LABELS[batch.stage] || batch.stage}
        </span>
      </div>

      <StageProgress stage={batch.stage} />

      {batch.notes && (
        <p className="text-sm text-gray-500 mt-3 italic">{batch.notes}</p>
      )}

      {/* Action button */}
      {!isCompleted && (
        <button
          onClick={() => onAdvance(batch.id)}
          disabled={advancing}
          className="w-full mt-5 py-5 bg-[#FF6B35] hover:bg-[#E55A24] active:bg-[#CC4A1A] text-white font-black text-xl rounded-2xl flex items-center justify-center gap-3 transition-colors disabled:opacity-60 shadow-lg shadow-orange-200"
        >
          {advancing ? (
            <Loader2 size={28} className="animate-spin" />
          ) : (
            <>
              <span>Keyingi bosqichga</span>
              <div className="flex items-center gap-1">
                <span className="text-base opacity-80">
                  ({STAGE_LABELS[nextStage] || nextStage})
                </span>
                <ChevronRight size={24} />
              </div>
            </>
          )}
        </button>
      )}

      {isCompleted && (
        <div className="w-full mt-5 py-4 bg-green-50 border-2 border-green-200 text-green-700 font-bold text-lg rounded-2xl flex items-center justify-center gap-2">
          <CheckCircle size={24} />
          Tugallandi!
        </div>
      )}
    </div>
  )
}

export default function EmployeeDashboard() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [advancingId, setAdvancingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const fetchBatches = useCallback(() => {
    setLoading(true)
    fetch('/api/production/batches')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.batches ?? []
        // Normalize: API returns product: {id, name}, map to productName string
        setBatches(list.map((b: any) => ({
          ...b,
          productName: b.productName ?? b.product?.name ?? 'Noma\'lum mahsulot',
          stage: b.stage ?? b.currentStage ?? 'RECEIVING',
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchBatches() }, [fetchBatches])

  const handleAdvanceConfirm = async () => {
    if (!confirmId) return
    setAdvancingId(confirmId)
    setConfirmId(null)
    try {
      await fetch(`/api/production/batches/${confirmId}/advance`, { method: 'POST' })
      fetchBatches()
    } catch {}
    finally { setAdvancingId(null) }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="animate-spin text-[#FF6B35]" size={48} />
        <p className="text-gray-500 font-medium">Yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24 px-1">
      <div className="pt-2">
        <h1 className="text-3xl font-black text-gray-900">Mening Vazifalarim</h1>
        <p className="text-gray-500 text-base mt-1">
          {batches.filter((b) => b.stage !== 'COMPLETED').length} ta faol partiya
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle size={48} className="mb-4 opacity-40" />
          <p className="text-lg font-semibold">Vazifalar yo'q</p>
          <p className="text-sm mt-1">Sizga partiya tayinlanmagan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onAdvance={(id) => setConfirmId(id)}
              advancing={advancingId === batch.id}
            />
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmId(null)}
          />
          <div className="relative bg-white w-full rounded-t-3xl p-8 z-10">
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">
              Tayyor!
            </h3>
            <p className="text-center text-gray-500 text-base mb-8">
              Ushbu partiyani keyingi bosqichga o'tkazasizmi?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-4 border-2 border-gray-200 text-gray-700 font-bold text-lg rounded-2xl hover:bg-gray-50 transition-colors"
              >
                Bekor
              </button>
              <button
                onClick={handleAdvanceConfirm}
                className="flex-1 py-4 bg-[#FF6B35] text-white font-black text-lg rounded-2xl hover:bg-[#E55A24] transition-colors shadow-lg shadow-orange-200"
              >
                Ha, o'tkazish!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}