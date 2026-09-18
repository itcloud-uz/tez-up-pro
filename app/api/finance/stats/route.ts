import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [
      paidOrdersAggregate,
      cashOrdersAggregate,
      creditOrdersAggregate,
      unpaidDebts,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentType: 'CASH', paymentStatus: 'PAID' },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentType: 'CREDIT' },
      }),
      prisma.debt.findMany({
        where: { isPaid: false },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          order: { select: { id: true, totalAmount: true } },
        },
      }),
    ])

    const totalDebt = unpaidDebts.reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount ?? 0)), 0)

    const formattedDebts = unpaidDebts.map((d) => ({
      id: d.id,
      customerName: d.customer?.name ?? 'Noma\'lum mijoz',
      customerPhone: d.customer?.phone ?? '',
      amount: d.totalAmount - (d.paidAmount ?? 0),
      dueDate: d.dueDate ? d.dueDate.toISOString() : undefined,
      orderId: d.orderId,
      reminderSent: Boolean(d.lastReminderAt),
    }))

    return Response.json({
      totalRevenue: paidOrdersAggregate._sum.totalAmount ?? 0,
      cashRevenue: cashOrdersAggregate._sum.totalAmount ?? 0,
      creditRevenue: creditOrdersAggregate._sum.totalAmount ?? 0,
      totalDebt,
      debtCount: unpaidDebts.length,
      debts: formattedDebts,
    })
  } catch (error) {
    console.error('[FINANCE_STATS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}