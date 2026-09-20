import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { ProductionStage } from '@prisma/client'

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
    const stageParam = searchParams.get('stage') ?? undefined

    const batches = await prisma.productionBatch.findMany({
      where: stageParam ? { currentStage: stageParam as ProductionStage } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true },
        },
        assignedEmployee: {
          select: { id: true, name: true },
        },
        _count: { select: { stageLogs: true } },
      },
    })

    const formatted = batches.map((b) => ({
      id: b.id,
      productId: b.productId,
      productName: b.product?.name ?? 'Noma\'lum mahsulot',
      quantity: b.quantity,
      currentStage: b.currentStage,
      stage: b.currentStage,
      notes: b.notes,
      assignedEmployee: b.assignedEmployee?.name ?? null,
      startedAt: b.startedAt,
      completedAt: b.completedAt,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      stageLogsCount: b._count.stageLogs,
    }))

    return Response.json(formatted)
  } catch (error) {
    console.error('[BATCHES_GET]', error)
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
    const { productId, productName, quantity, notes } = body

    if ((!productId && !productName) || !quantity) {
      return Response.json(
        { error: 'Mahsulot va miqdori kiritilishi shart' },
        { status: 400 }
      )
    }

    let targetProductId = productId
    if (!targetProductId && productName) {
      // Find existing product or create one
      let product = await prisma.product.findFirst({
        where: { name: { equals: productName.trim(), mode: 'insensitive' } },
      })

      if (!product) {
        const slug = productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
        product = await prisma.product.create({
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
      targetProductId = product.id
    }

    const product = await prisma.product.findUnique({ where: { id: targetProductId } })
    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    const batch = await prisma.productionBatch.create({
      data: {
        productId: targetProductId,
        quantity: Number(quantity),
        notes: notes ?? null,
        currentStage: 'RECEIVING',
        stageLogs: {
          create: {
            fromStage: 'RECEIVING',
            toStage: 'RECEIVING',
            notes: notes ?? 'Batch created',
            employeeId: session.user.id,
          },
        },
      },
      include: {
        product: { select: { id: true, name: true } },
        stageLogs: true,
      },
    })

    return Response.json(batch, { status: 201 })
  } catch (error) {
    console.error('[BATCHES_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
