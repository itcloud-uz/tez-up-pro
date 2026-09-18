import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        supplier: true,
        fabricRolls: {
          orderBy: { receivedAt: 'desc' },
        },
      },
    })

    if (!material) {
      return Response.json({ error: 'Material not found' }, { status: 404 })
    }

    return Response.json({
      ...material,
      lowStock: material.currentStock <= material.minStock,
    })
  } catch (error) {
    console.error('[MATERIAL_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { name, type, unit, currentStock, minStock, supplierId, stockAdjustment } = body

    const existing = await prisma.rawMaterial.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Material not found' }, { status: 404 })
    }

    // Support relative stock adjustment (e.g. +50, -20) or absolute set
    let newStock = existing.currentStock
    if (stockAdjustment !== undefined) {
      newStock = existing.currentStock + Number(stockAdjustment)
    } else if (currentStock !== undefined) {
      newStock = Number(currentStock)
    }

    const updated = await prisma.rawMaterial.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(unit !== undefined && { unit }),
        ...(minStock !== undefined && { minStock: Number(minStock) }),
        ...(supplierId !== undefined && { supplierId }),
        currentStock: newStock,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    })

    return Response.json({
      ...updated,
      lowStock: updated.currentStock <= updated.minStock,
    })
  } catch (error) {
    console.error('[MATERIAL_PUT]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const material = await prisma.rawMaterial.findUnique({
      where: { id },
      include: { _count: { select: { fabricRolls: true } } },
    })

    if (!material) {
      return Response.json({ error: 'Material not found' }, { status: 404 })
    }

    await prisma.rawMaterial.delete({ where: { id } })
    return Response.json({ message: 'Material deleted' })
  } catch (error) {
    console.error('[MATERIAL_DELETE]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}