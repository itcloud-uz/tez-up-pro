import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.orderStatus === 'CANCELLED') {
      return Response.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { orderStatus: 'CANCELLED' },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[ORDER_REJECT_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}