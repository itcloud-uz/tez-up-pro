import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const settings = await prisma.systemSetting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    // Admin profil ma'lumotlari
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, phone: true, email: true },
    })

    return Response.json({
      settings: settingsMap,
      profile: adminUser,
    })
  } catch (error) {
    console.error('[SETTINGS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { settings, profile } = body

    // 1. Sozlamalarni saqlash / yangilash
    if (settings && typeof settings === 'object') {
      const updates = Object.entries(settings).map(([key, value]) => {
        let group = 'GENERAL'
        if (key.startsWith('ESKIZ_')) group = 'ESKIZ'
        else if (key.startsWith('META_')) group = 'META'
        else if (key.startsWith('CRM_')) group = 'CRM'

        return prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value ?? ''), group },
          create: { key, value: String(value ?? ''), group },
        })
      })

      await prisma.$transaction(updates)
    }

    // 2. Profilni yangilash (agar berilgan bo'lsa)
    if (profile && typeof profile === 'object') {
      const updateData: any = {}
      if (profile.name) updateData.name = profile.name
      if (profile.email !== undefined) updateData.email = profile.email || null
      if (profile.password && profile.password.trim().length >= 6) {
        updateData.passwordHash = await bcrypt.hash(profile.password.trim(), 12)
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: updateData,
        })
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[SETTINGS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}