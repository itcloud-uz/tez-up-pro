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

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        rawMaterials: {
          select: {
            id: true,
            name: true,
            type: true,
            unit: true,
            currentStock: true,
            minStock: true,
          },
        },
      },
    })

    if (!supplier) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return Response.json(supplier)
  } catch (error) {
    console.error('[SUPPLIER_GET]', error)
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
    const { name, type, contactName, phone, address, notes } = body

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(contactName !== undefined && { contactName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[SUPPLIER_PUT]', error)
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

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { rawMaterials: true } } },
    })

    if (!supplier) {
      return Response.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (supplier._count.rawMaterials > 0) {
      return Response.json(
        { error: 'Cannot delete supplier with associated materials' },
        { status: 409 }
      )
    }

    await prisma.supplier.delete({ where: { id } })
    return Response.json({ message: 'Supplier deleted' })
  } catch (error) {
    console.error('[SUPPLIER_DELETE]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}