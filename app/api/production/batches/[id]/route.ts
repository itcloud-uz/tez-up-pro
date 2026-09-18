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

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { notes, assignedEmployeeId } = body

    const existing = await prisma.productionBatch.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Batch not found' }, { status: 404 })
    }

    const updated = await prisma.productionBatch.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(assignedEmployeeId !== undefined && { assignedEmployeeId }),
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