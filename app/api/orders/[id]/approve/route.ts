import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: { delivery: true },
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.orderStatus === 'APPROVED') {
      return Response.json(
        { error: 'Order is already approved' },
        { status: 400 }
      )
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const approved = await tx.order.update({
        where: { id },
        data: {
          orderStatus: 'APPROVED',
          paymentStatus: 'PAID',
          receiptVerifiedAt: new Date(),
          receiptVerifiedById: session.user.id,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          delivery: true,
        },
      })

      // Create Delivery record if not already existing
      // Order does not have a direct deliveryAddress field — use body or placeholder
      if (!order.delivery) {
        await tx.delivery.create({
          data: {
            orderId: id,
            deliveryAddress: (body?.deliveryAddress as string) || 'Not specified',
            status: 'PENDING',
          },
        })
      }

      return approved
    })

    return Response.json(updatedOrder)
  } catch (error) {
    console.error('[ORDER_APPROVE_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}