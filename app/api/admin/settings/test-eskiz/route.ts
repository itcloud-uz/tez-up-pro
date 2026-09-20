import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    let { email, password, sender } = body

    if (!email || !password) {
      // Agar tanada berilmagan bo'lsa, DB dan olamiz
      const dbSettings = await prisma.systemSetting.findMany({
        where: { key: { in: ['ESKIZ_EMAIL', 'ESKIZ_PASSWORD', 'ESKIZ_SENDER'] } },
      })
      const map: Record<string, string> = {}
      dbSettings.forEach((s) => (map[s.key] = s.value))
      email = email || map['ESKIZ_EMAIL'] || process.env.ESKIZ_EMAIL
      password = password || map['ESKIZ_PASSWORD'] || process.env.ESKIZ_PASSWORD
      sender = sender || map['ESKIZ_SENDER'] || process.env.ESKIZ_SENDER || '4546'
    }

    if (!email || !password) {
      return Response.json({ error: 'Eskiz email va parol kiritilmagan' }, { status: 400 })
    }

    // Eskiz auth API ga so'rov yuboramiz
    const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok || !data?.data?.token) {
      return Response.json({
        success: false,
        error: data?.message || 'Eskiz serveriga ulanib bo\'lmadi. Email yoki parol xato!',
      }, { status: 400 })
    }

    // Foydalanuvchi balansi va ma'lumotlarini olish
    const userRes = await fetch('https://notify.eskiz.uz/api/auth/user', {
      headers: { Authorization: `Bearer ${data.data.token}` },
    })
    const userData = await userRes.json()

    return Response.json({
      success: true,
      message: 'Eskiz.uz ga muvaffaqiyatli ulandi!',
      balance: userData?.data?.balance ?? null,
      isVip: userData?.data?.is_vip ?? false,
    })
  } catch (error: any) {
    console.error('[TEST_ESKIZ_ERROR]', error)
    return Response.json({
      success: false,
      error: error.message || 'Tarmoq xatosi yuz berdi',
    }, { status: 500 })
  }
}