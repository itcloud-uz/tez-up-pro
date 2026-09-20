import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const batch = await prisma.productionBatch.findUnique({
      where: { id },
      include: {
        product: true,
        assignedEmployee: { select: { id: true, name: true } },
        stageLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!batch) {
      return Response.json({ error: 'Batch not found' }, { status: 404 })
    }

    return Response.json(batch)
  } catch (error) {
    console.error('[BATCH_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { productName, quantity, notes, assignedEmployeeId, stage } = body

    const existing = await prisma.productionBatch.findUnique({
      where: { id },
      include: { product: true },
    })
    if (!existing) {
      return Response.json({ error: 'Batch not found' }, { status: 404 })
    }

    let productId = existing.productId
    if (productName && productName.trim() && productName.trim() !== existing.product?.name) {
      // Find or create new product with that name
      let prod = await prisma.product.findFirst({
        where: { name: { equals: productName.trim(), mode: 'insensitive' } },
      })
      if (!prod) {
        const slug = productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
        prod = await prisma.product.create({
          data: {
            name: productName.trim(),
            slug,
            category: 'Umumiy',
            price: 0,
            b2bPrice: 0,
            stock: 0,
            images: [],
          },
        })
      }
      productId = prod.id
    }

    const updated = await prisma.productionBatch.update({
      where: { id },
      data: {
        productId,
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(notes !== undefined && { notes }),
        ...(assignedEmployeeId !== undefined && {
          assignedEmployeeId: assignedEmployeeId || null,
        }),
        ...(stage !== undefined && { currentStage: stage }),
      },
      include: {
        product: { select: { id: true, name: true } },
        assignedEmployee: { select: { id: true, name: true } },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[BATCH_PUT]', error)
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

    const existing = await prisma.productionBatch.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Batch not found' }, { status: 404 })
    }

    // Delete related stageLogs and the batch
    await prisma.$transaction([
      prisma.stageLog.deleteMany({ where: { batchId: id } }),
      prisma.productionBatch.delete({ where: { id } }),
    ])

    return Response.json({ success: true, message: "Partiya muvaffaqiyatli o'chirildi" })
  } catch (error) {
    console.error('[BATCH_DELETE]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}