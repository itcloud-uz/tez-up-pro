import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { SupplierType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const typeParam = searchParams.get('type')
    const type = typeParam ? (typeParam as SupplierType) : undefined

    const suppliers = await prisma.supplier.findMany({
      where: type ? { type } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { rawMaterials: true } },
      },
    })

    return Response.json(suppliers)
  } catch (error) {
    console.error('[SUPPLIERS_GET]', error)
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
    const { name, contactName, phone, address, notes } = body
    const type = body.type || 'LOCAL'

    if (!name) {
      return Response.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        type,
        contactName: contactName ?? null,
        phone: phone ?? null,
        address: address ?? null,
        notes: notes ?? null,
      },
    })

    return Response.json(supplier, { status: 201 })
  } catch (error) {
    console.error('[SUPPLIERS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}