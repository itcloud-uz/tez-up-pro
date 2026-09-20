import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const materials = await prisma.rawMaterial.findMany({
      orderBy: { name: 'asc' },
      include: {
        supplier: {
          select: { id: true, name: true, type: true, phone: true },
        },
        _count: {
          select: { fabricRolls: true },
        },
      },
    })

    const result = materials.map((m) => ({
      ...m,
      lowStock: m.currentStock <= m.minStock,
    }))

    return Response.json(result)
  } catch (error) {
    console.error('[MATERIALS_GET]', error)
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
    const { name, unit, supplierId } = body
    const type = body.type || 'FABRIC'
    const currentStock = Number(body.currentStock ?? body.stock ?? 0)
    const minStock = Number(body.minStock ?? 0)

    if (!name || !unit) {
      return Response.json(
        { error: 'name and unit are required' },
        { status: 400 }
      )
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        type,
        unit,
        currentStock,
        minStock,
        supplierId: supplierId ?? null,
      },
      include: {
        supplier: {
          select: { id: true, name: true, type: true },
        },
      },
    })

    return Response.json(
      { ...material, lowStock: material.currentStock <= material.minStock },
      { status: 201 }
    )
  } catch (error) {
    console.error('[MATERIALS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}