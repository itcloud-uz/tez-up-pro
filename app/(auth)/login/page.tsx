'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.slice(0, 9)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (phone.length < 9) {
      setError("To'liq telefon raqamini kiriting")
      return
    }
    if (password.length < 4) {
      setError("Parol juda qisqa")
      return
    }

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        phone: '+998' + phone,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Telefon raqam yoki parol noto'g'ri")
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Xatolik yuz berdi. Qayta urinib koering')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-start px-4 pt-16 pb-8">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B35] rounded-2xl mb-4 shadow-lg">
          <span className="text-white font-black text-2xl">T</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900">
          Tez <span className="text-[#FF6B35]">Up</span> Pro
        </h1>
        <p className="text-gray-500 text-sm mt-1">ERP | CRM | E-commerce</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4"
        noValidate
      >
        {/* Phone field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Telefon raqam
          </label>
          <div className="flex h-12 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FF6B35] focus-within:border-transparent transition-all">
            <span className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-gray-500 font-medium text-sm whitespace-nowrap">
              +998
            </span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="flex-1 px-3 bg-white text-gray-900 placeholder-gray-400 focus:outline-none text-base"
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Parol
          </label>
          <div className="flex h-12 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FF6B35] focus-within:border-transparent transition-all">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Parolingizni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-4 bg-white text-gray-900 placeholder-gray-400 focus:outline-none text-base"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="px-3 bg-white text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] flex items-center justify-center"
              aria-label={showPassword ? "Parolni yashirish" : "Parolni koerish"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-start gap-2">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Yuklanmoqda...</span>
            </>
          ) : (
            'Kirish'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-gray-400 text-xs mt-8 text-center">
        © {new Date().getFullYear()} Tez Up Pro. Barcha huquqlar himoyalangan.
      </p>
    </div>
  )
}