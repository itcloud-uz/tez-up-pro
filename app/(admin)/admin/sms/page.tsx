'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2, MessageSquare, Users, Phone } from 'lucide-react'

interface SmsLog {
  id: string
  to: string
  message: string
  status: 'sent' | 'failed' | 'pending'
  sentAt: string
}

type Target = 'all_debtors' | 'custom'

export default function SMSPage() {
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<Target>('all_debtors')
  const [customPhone, setCustomPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const MAX_CHARS = 160

  useEffect(() => {
    fetch('/api/sms/send')
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : data.logs ?? []))
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    if (target === 'custom' && !customPhone.trim()) {
      setErrorMsg('Telefon raqamni kiriting')
      return
    }

    setSending(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          phone: target === 'custom' ? '+998' + customPhone.replace(/\D/g, '') : undefined,
          message: message.trim(),
        }),
      })

      if (!res.ok) throw new Error()

      const data = await res.json()
      setSuccessMsg(`SMS yuborildi! Jami: ${data.count ?? 1} ta`)
      setMessage('')
      setCustomPhone('')

      // Refresh logs
      const logsRes = await fetch('/api/sms/send')
      const logsData = await logsRes.json()
      setLogs(Array.isArray(logsData) ? logsData : logsData.logs ?? [])
    } catch {
      setErrorMsg('SMS yuborishda xatolik yuz berdi')
    } finally {
      setSending(false)
    }
  }

  const statusColors = {
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
  }
  const statusLabels = {
    sent: 'Yuborildi',
    failed: 'Xato',
    pending: 'Kutilmoqda',
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-gray-900">SMS Xabarlar</h1>
        <p className="text-gray-500 text-sm">Mijozlarga SMS yuborish</p>
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="card space-y-4">
        <h2 className="section-header">Yangi xabar</h2>

        {/* Target selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kimga?</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTarget('all_debtors')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                target === 'all_debtors'
                  ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Users size={16} />
              Barcha qarzdorlar
            </button>
            <button
              type="button"
              onClick={() => setTarget('custom')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                target === 'custom'
                  ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Phone size={16} />
              Maxsus raqam
            </button>
          </div>
        </div>

        {/* Custom phone */}
        {target === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Telefon raqam
            </label>
            <div className="flex h-12 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FF6B35]">
              <span className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-gray-500 font-medium text-sm">
                +998
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="90 123 45 67"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1 px-3 bg-white text-gray-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Xabar matni</label>
          <textarea
            className="input-field h-32 py-3 resize-none"
            placeholder="Xabar yozing..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            required
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>
              {message.length >= MAX_CHARS && (
                <span className="text-red-500">Maksimal uzunlik</span>
              )}
            </span>
            <span className={message.length >= MAX_CHARS ? 'text-red-500 font-semibold' : ''}>
              {message.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Feedback */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            ⚠ {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </form>

      {/* SMS Log */}
      <section>
        <h2 className="section-header">Yuborilgan xabarlar</h2>
        {logsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#FF6B35]" size={24} />
          </div>
        ) : logs.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">SMS yuborilmagan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="card">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">{log.to}</p>
                  <span className={`badge text-xs ${statusColors[log.status]}`}>
                    {statusLabels[log.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{log.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(log.sentAt).toLocaleString('uz-UZ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}