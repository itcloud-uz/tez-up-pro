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

  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        delivery: true,
        debt: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            isPaid: true,
            dueDate: true,
          },
        },
        receiptVerifiedBy: { select: { id: true, name: true } },
      },
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // CUSTOMER can only see their own order
    if (
      session.user.role === 'CUSTOMER' &&
      order.customerId !== session.user.id
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(order)
  } catch (error) {
    console.error('[ORDER_GET]', error)
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
    const { orderStatus, notes } = body

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus !== undefined && { orderStatus }),
        ...(notes !== undefined && { notes }),
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[ORDER_PUT]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}