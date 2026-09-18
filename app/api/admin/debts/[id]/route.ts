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

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        order: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    })

    if (!debt) {
      return Response.json({ error: 'Debt not found' }, { status: 404 })
    }

    return Response.json(debt)
  } catch (error) {
    console.error('[DEBT_GET]', error)
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
    const { paidAmount, isPaid } = body

    const debt = await prisma.debt.findUnique({ where: { id } })
    if (!debt) {
      return Response.json({ error: 'Debt not found' }, { status: 404 })
    }

    if (debt.isPaid) {
      return Response.json({ error: 'Debt is already fully paid' }, { status: 400 })
    }

    let updateData: {
      paidAmount?: number
      isPaid?: boolean
      paidAt?: Date
    } = {}

    if (isPaid === true) {
      // Mark as fully paid
      updateData = {
        isPaid: true,
        paidAmount: debt.totalAmount,
      }
    } else if (paidAmount !== undefined) {
      const newPaidAmount = (debt.paidAmount ?? 0) + Number(paidAmount)
      const isNowFullyPaid = newPaidAmount >= debt.totalAmount

      updateData = {
        paidAmount: Math.min(newPaidAmount, debt.totalAmount),
        isPaid: isNowFullyPaid,
        ...(isNowFullyPaid && { lastReminderAt: new Date() }),
      }
    } else {
      return Response.json(
        { error: 'Provide paidAmount or isPaid: true' },
        { status: 400 }
      )
    }

    const updated = await prisma.debt.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    })

    // If debt is now fully paid, update order payment status
    if (updated.isPaid && debt.orderId) {
      await prisma.order.update({
        where: { id: debt.orderId },
        data: { paymentStatus: 'PAID' },
      })
    }

    return Response.json(updated)
  } catch (error) {
    console.error('[DEBT_PUT]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}