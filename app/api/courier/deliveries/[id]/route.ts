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

  if (!['ADMIN', 'COURIER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        courier: { select: { id: true, name: true, phone: true } },
        order: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, price: true },
                },
              },
            },
            debt: {
              select: { id: true, totalAmount: true, isPaid: true },
            },
          },
        },
      },
    })

    if (!delivery) {
      return Response.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Courier can only view their own delivery
    if (
      session.user.role === 'COURIER' &&
      delivery.courierId !== session.user.id
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(delivery)
  } catch (error) {
    console.error('[DELIVERY_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'COURIER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            paymentType: true,
            totalAmount: true,
            customerId: true,
          },
        },
      },
    })

    if (!delivery) {
      return Response.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Courier can only update their own delivery
    if (
      session.user.role === 'COURIER' &&
      delivery.courierId !== session.user.id
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Couriers can only set IN_TRANSIT or DELIVERED
    const allowedStatuses = ['IN_TRANSIT', 'DELIVERED']
    if (!allowedStatuses.includes(status)) {
      return Response.json(
        { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (status === 'DELIVERED') {
      // Use the order.totalAmount from the initial query (before transaction)
      const orderTotalAmount = delivery.order.totalAmount

      // Transition order status and close cash debt in a transaction
      const updated = await prisma.$transaction(async (tx) => {
        const updatedDelivery = await tx.delivery.update({
          where: { id },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        })

        await tx.order.update({
          where: { id: delivery.orderId },
          data: { orderStatus: 'DELIVERED' },
        })

        // If cash payment, mark debt as paid (cash on delivery)
        if (delivery.order.paymentType === 'CASH') {
          await tx.debt.updateMany({
            where: { orderId: delivery.orderId, isPaid: false },
            data: {
              isPaid: true,
              paidAmount: orderTotalAmount,
            },
          })
        }

        return updatedDelivery
      })

      return Response.json(updated)
    }

    // Status is IN_TRANSIT
    const updated = await prisma.delivery.update({
      where: { id },
      data: { status: 'IN_TRANSIT' },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[DELIVERY_PUT]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}