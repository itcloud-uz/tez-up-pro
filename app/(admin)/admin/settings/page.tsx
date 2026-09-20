'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  MessageSquare,
  Share2,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  Key,
  Globe,
  Sliders,
  Send,
  Zap,
} from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'eskiz' | 'meta' | 'general'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Profil
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Eskiz SMS
  const [eskizEmail, setEskizEmail] = useState('')
  const [eskizPassword, setEskizPassword] = useState('')
  const [eskizSender, setEskizSender] = useState('4546')
  const [testingEskiz, setTestingEskiz] = useState(false)
  const [eskizStatus, setEskizStatus] = useState<{ connected: boolean; balance?: any; message?: string } | null>(null)

  // Meta & CRM Webhook
  const [metaVerifyToken, setMetaVerifyToken] = useState('tezup_meta_verify_2026')
  const [metaAppId, setMetaAppId] = useState('')
  const [metaAppSecret, setMetaAppSecret] = useState('')
  const [metaAccessToken, setMetaAccessToken] = useState('')
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  // Umumiy sozlamalar
  const [companyName, setCompanyName] = useState('Tez Up Pro')
  const [currencySymbol, setCurrencySymbol] = useState("so'm")
  const [bankName, setBankName] = useState('Kapitalbank')
  const [bankCard, setBankCard] = useState('8600 0000 0000 0000')
  const [bankHolder, setBankHolder] = useState('Tez Up Pro LLC')

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/crm/webhook`
    : 'https://it-cloud.uz/api/crm/webhook'

  // Ma'lumotlarni yuklash
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfileName(data.profile.name || '')
          setProfilePhone(data.profile.phone || '')
          setProfileEmail(data.profile.email || '')
        }
        if (data.settings) {
          const s = data.settings
          if (s.ESKIZ_EMAIL) setEskizEmail(s.ESKIZ_EMAIL)
          if (s.ESKIZ_PASSWORD) setEskizPassword(s.ESKIZ_PASSWORD)
          if (s.ESKIZ_SENDER) setEskizSender(s.ESKIZ_SENDER)
          if (s.META_VERIFY_TOKEN) setMetaVerifyToken(s.META_VERIFY_TOKEN)
          if (s.META_APP_ID) setMetaAppId(s.META_APP_ID)
          if (s.META_APP_SECRET) setMetaAppSecret(s.META_APP_SECRET)
          if (s.META_ACCESS_TOKEN) setMetaAccessToken(s.META_ACCESS_TOKEN)
          if (s.COMPANY_NAME) setCompanyName(s.COMPANY_NAME)
          if (s.BANK_NAME) setBankName(s.BANK_NAME)
          if (s.BANK_CARD) setBankCard(s.BANK_CARD)
          if (s.BANK_HOLDER) setBankHolder(s.BANK_HOLDER)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Saqlash
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: {
            name: profileName,
            email: profileEmail,
            password: newPassword || undefined,
          },
          settings: {
            ESKIZ_EMAIL: eskizEmail,
            ESKIZ_PASSWORD: eskizPassword,
            ESKIZ_SENDER: eskizSender,
            META_VERIFY_TOKEN: metaVerifyToken,
            META_APP_ID: metaAppId,
            META_APP_SECRET: metaAppSecret,
            META_ACCESS_TOKEN: metaAccessToken,
            COMPANY_NAME: companyName,
            BANK_NAME: bankName,
            BANK_CARD: bankCard,
            BANK_HOLDER: bankHolder,
          },
        }),
      })

      if (res.ok) {
        setNewPassword('')
        setMessage({ text: 'Barcha sozlamalar muvaffaqiyatli saqlandi!', type: 'success' })
      } else {
        setMessage({ text: 'Sozlamalarni saqlashda xatolik yuz berdi', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Tarmoq xatosi', type: 'error' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Eskiz ulanishini tekshirish
  const handleTestEskiz = async () => {
    setTestingEskiz(true)
    setEskizStatus(null)

    try {
      const res = await fetch('/api/admin/settings/test-eskiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: eskizEmail,
          password: eskizPassword,
          sender: eskizSender,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setEskizStatus({
          connected: true,
          balance: data.balance,
          message: data.message,
        })
      } else {
        setEskizStatus({
          connected: false,
          message: data.error || 'Ulanib bo\'lmadi. Login yoki parolni tekshiring',
        })
      }
    } catch {
      setEskizStatus({ connected: false, message: 'Tarmoq xatosi' })
    } finally {
      setTestingEskiz(false)
    }
  }

  const copyText = (text: string, type: 'webhook' | 'token') => {
    navigator.clipboard.writeText(text)
    if (type === 'webhook') {
      setCopiedWebhook(true)
      setTimeout(() => setCopiedWebhook(false), 2000)
    } else {
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FF6B35]" size={36} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Settings className="text-[#FF6B35]" size={28} />
          Tizim Sozlamalari
        </h1>
        <p className="text-gray-500 text-sm">Profil, SMS xizmati, Meta Target integratsiyasi va boshqaruv</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User size={16} /> Profil & Xavfsizlik
        </button>
        <button
          onClick={() => setActiveTab('eskiz')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'eskiz' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare size={16} /> Eskiz SMS Ulanishi
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'meta' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Share2 size={16} /> Meta (Target / CRM)
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'general' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sliders size={16} /> Umumiy & Rekvizitlar
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. PROFIL VA PAROL SOZLAMALARI */}
        {activeTab === 'profile' && (
          <div className="card bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Shield size={18} className="text-[#FF6B35]" />
              Administrator Profil Ma'lumotlari
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Ism / Familiya</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input-field"
                  placeholder="Masalan: Bosh Admin"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Telefon raqam (Login)</label>
                <input
                  type="text"
                  value={profilePhone}
                  disabled
                  className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-gray-400">Telefon raqam asosiy identifikator hisoblanadi</span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email manzil</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="input-field"
                  placeholder="admin@it-cloud.uz"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yangi Parol o'rnatish</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                  minLength={6}
                />
                <span className="text-[11px] text-gray-400">Kamida 6 ta belgi</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. ESKIZ SMS INTEGRATSIYASI */}
        {activeTab === 'eskiz' && (
          <div className="card bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-[#FF6B35]" />
                Eskiz.uz SMS Provayderi Sozlamalari
              </h2>
              <a
                href="https://eskiz.uz"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#FF6B35] font-semibold flex items-center gap-1 hover:underline"
              >
                eskiz.uz <ExternalLink size={12} />
              </a>
            </div>

            <p className="text-xs text-gray-500">
              Qarzdorlarga eslatma, buyurtma holati o'zgarganda xaridorga SMS va ommaviy SMS jo'natish uchun Eskiz hisobingiz ma'lumotlarini kiriting.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Eskiz Login (Email) *</label>
                <input
                  type="email"
                  value={eskizEmail}
                  onChange={(e) => setEskizEmail(e.target.value)}
                  className="input-field"
                  placeholder="masalan: info@company.uz"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Eskiz Parol *</label>
                <input
                  type="password"
                  value={eskizPassword}
                  onChange={(e) => setEskizPassword(e.target.value)}
                  className="input-field"
                  placeholder="Eskiz shaxsiy kabinet paroli"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Yuboruvchi nomi (Sender / Nik) *</label>
                <input
                  type="text"
                  value={eskizSender}
                  onChange={(e) => setEskizSender(e.target.value)}
                  className="input-field"
                  placeholder="4546 yoki Tasdiqlangan Nik"
                />
              </div>
            </div>

            {/* Test tugmasi va Status */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-800">Ulanishni tekshirish</p>
                <p className="text-[11px] text-gray-500">Kiritilgan login va parolni Eskiz API orqali test qiling</p>
              </div>

              <button
                type="button"
                onClick={handleTestEskiz}
                disabled={testingEskiz || !eskizEmail || !eskizPassword}
                className="px-4 py-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#FF6B35] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {testingEskiz ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                Eskiz Ulanishini Test Qilish
              </button>
            </div>

            {eskizStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  eskizStatus.connected
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {eskizStatus.connected ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>
                  {eskizStatus.message}{' '}
                  {eskizStatus.balance !== undefined && eskizStatus.balance !== null && (
                    <b className="ml-1">(Hisobingizdagi SMS balansi: {eskizStatus.balance})</b>
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 3. META TARGET & CRM WEBHOOK INTEGRATSIYASI */}
        {activeTab === 'meta' && (
          <div className="card bg-white p-6 rounded-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Share2 size={18} className="text-[#FF6B35]" />
                Meta (Facebook / Instagram) Target Reklama & CRM Webhook
              </h2>
              <span className="badge bg-blue-50 text-blue-700 text-xs">Jonli Integratsiya</span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Instagram yoki Facebookda yoqilgan target reklamalaringizdan (Lead Ads formalaridan) kelgan har bir mijoz avtomatik tarzda tizimdagi <b>CRM Kanban doskasiga ("Yangi")</b> bo'limiga tushadi.
            </p>

            {/* Webhook manzili */}
            <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                <Globe size={14} /> Meta Webhook Callback URL:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="input-field bg-white font-mono text-xs text-gray-800 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyText(webhookUrl, 'webhook')}
                  className="px-3 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E55A24] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Copy size={14} />
                  {copiedWebhook ? 'Nusxalandi!' : 'Nusxa'}
                </button>
              </div>
              <p className="text-[11px] text-orange-700">
                Ushbu manzilni Meta Developers (developers.facebook.com) portalidagi Webhooks bo'limiga kiriting.
              </p>
            </div>

            {/* Verify Token */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Meta Verify Token (Tasdiqlash kaliti)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={metaVerifyToken}
                    onChange={(e) => setMetaVerifyToken(e.target.value)}
                    className="input-field font-mono text-xs"
                    placeholder="tezup_meta_verify_2026"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => copyText(metaVerifyToken, 'token')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
                    title="Nusxa olish"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <span className="text-[11px] text-gray-400">Meta tekshiruvi uchun kiritiladigan maxfiy token</span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Meta App ID (ixtiyoriy)</label>
                <input
                  type="text"
                  value={metaAppId}
                  onChange={(e) => setMetaAppId(e.target.value)}
                  className="input-field font-mono text-xs"
                  placeholder="Masalan: 104829104820194"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Meta Page Access Token (Doimiy Kirish Tokeni)
              </label>
              <textarea
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value)}
                className="input-field h-20 py-2.5 text-xs font-mono resize-none"
                placeholder="EAAO... (Meta sahifasi tokeni - target formalarini avtomatik yuklash uchun)"
              />
              <span className="text-[11px] text-gray-400">
                Facebook Business Manager orqali olingan System User Access Token
              </span>
            </div>
          </div>
        )}

        {/* 4. UMUMIY & REKVIZITLAR */}
        {activeTab === 'general' && (
          <div className="card bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Sliders size={18} className="text-[#FF6B35]" />
              Kompaniya va To'lov Rekvizitlari
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Kompaniya nomi</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                  placeholder="Tez Up Pro"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Bank nomi</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="input-field"
                  placeholder="Kapitalbank"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Bank karta raqami (Hisob-kitob)</label>
                <input
                  type="text"
                  value={bankCard}
                  onChange={(e) => setBankCard(e.target.value)}
                  className="input-field font-mono"
                  placeholder="8600 0000 0000 0000"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Karta / Hisob egasi</label>
                <input
                  type="text"
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="input-field"
                  placeholder="Tez Up Pro LLC"
                />
              </div>
            </div>
          </div>
        )}

        {/* Saqlash tugmasi */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Barcha O'zgarishlarni Saqlash
          </button>
        </div>
      </form>
    </div>
  )
}