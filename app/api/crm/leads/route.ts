import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { LeadSource, LeadStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status') ?? undefined
    const sourceParam = searchParams.get('source') ?? undefined

    const leads = await prisma.lead.findMany({
      where: {
        ...(statusParam ? { status: statusParam as LeadStatus } : {}),
        ...(sourceParam ? { source: sourceParam as LeadSource } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    })

    return Response.json(leads)
  } catch (error) {
    console.error('[LEADS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, phone, email, source, notes } = body

    if (!name || !phone) {
      return Response.json(
        { error: 'name and phone are required' },
        { status: 400 }
      )
    }

    // Map source safely to valid enum
    const validSources: Record<string, LeadSource> = {
      FACEBOOK: 'FACEBOOK',
      INSTAGRAM: 'INSTAGRAM',
      TIKTOK: 'TIKTOK',
      MANUAL: 'MANUAL',
      OTHER: 'OTHER',
    }
    const cleanSource = source ? String(source).toUpperCase().trim() : 'MANUAL'
    const leadSource: LeadSource = validSources[cleanSource] || 'MANUAL'

    const lead = await prisma.lead.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : null,
        source: leadSource,
        notes: notes ? String(notes).trim() : null,
        status: (body.status === 'CONTACTED' || body.status === 'ORDERED' || body.status === 'CLOSED') ? body.status : 'NEW',
      },
    })

    return Response.json(lead, { status: 201 })
  } catch (error) {
    console.error('[LEADS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
