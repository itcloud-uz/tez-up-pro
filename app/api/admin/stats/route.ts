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
      totalOrders,
      pendingApproval,
      paidOrdersAggregate,
      totalDebtAggregate,
      productionBatchesByStage,
      recentOrders,
      allMaterials,
      leadsByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING_APPROVAL' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.debt.aggregate({
        _sum: { totalAmount: true },
        where: { isPaid: false },
      }),
      prisma.productionBatch.groupBy({
        by: ['currentStage'],
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.rawMaterial.findMany({
        select: {
          id: true, name: true, type: true, unit: true,
          currentStock: true, minStock: true,
        },
      }),
      prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ])

    // Filter low stock in JS (avoids Prisma field reference limitation)
    const lowStockMaterials = allMaterials.filter(
      (m) => m.currentStock <= m.minStock
    )

    const batchesByStage = productionBatchesByStage.reduce(
      (acc: Record<string, number>, item) => {
        acc[item.currentStage] = item._count.id
        return acc
      },
      {}
    )

    const leadsStatusMap = leadsByStatus.reduce(
      (acc: Record<string, number>, item) => {
        acc[item.status] = item._count.id
        return acc
      },
      {}
    )

    // pipeline as array for dashboard
    const pipeline = Object.entries(batchesByStage).map(([stage, count]) => ({
      stage,
      count,
    }))

    // recentOrders formatted for dashboard
    const formattedRecentOrders = recentOrders.map((o) => ({
      id: o.id,
      customer: o.customer?.name ?? 'Noma\'lum',
      total: o.totalAmount,
      status: o.orderStatus,
      createdAt: o.createdAt.toISOString(),
    }))

    return Response.json({
      totalOrders,
      pendingApproval,
      totalRevenue: paidOrdersAggregate._sum.totalAmount ?? 0,
      totalDebt: totalDebtAggregate._sum.totalAmount ?? 0,
      pipeline,
      productionBatchesByStage: batchesByStage,
      recentOrders: formattedRecentOrders,
      lowStockMaterials,
      leadsByStatus: leadsStatusMap,
    })
  } catch (error) {
    console.error('[ADMIN_STATS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}