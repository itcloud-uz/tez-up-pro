import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      // Barcha shaxslar/do'konlar ro'yxati va ularning balansi, qarzlari, xaridlari
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['CUSTOMER', 'EMPLOYEE'] },
        },
        orderBy: { name: 'asc' },
        include: {
          debts: {
            where: { isPaid: false },
            include: {
              order: {
                include: {
                  items: {
                    include: { product: true },
                  },
                },
              },
            },
          },
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              items: { include: { product: true } },
            },
          },
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { account: true },
          },
        },
      })

      const list = users.map((u) => {
        const totalUnpaidDebt = u.debts.reduce(
          (sum, d) => sum + (d.totalAmount - (d.paidAmount ?? 0)),
          0
        )

        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          isWholesale: u.isWholesale,
          balance: u.balance, // Musbat = ortiqcha to'lov/avans, Manfiy = umumiy hisob-kitob
          totalDebt: totalUnpaidDebt,
          unpaidDebtsCount: u.debts.length,
          ordersCount: u.orders.length,
          recentOrders: u.orders,
          recentDebts: u.debts,
          recentTransactions: u.transactions,
        }
      })

      return Response.json(list)
    }

    // Muayyan shaxs bo'yicha to'liq akt-sverka ma'lumotlari
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        debts: {
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              include: {
                items: { include: { product: true } },
              },
            },
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { product: true } },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: { account: true },
        },
      },
    })

    if (!user) {
      return Response.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 })
    }

    const totalUnpaidDebt = user.debts
      .filter((d) => !d.isPaid)
      .reduce((sum, d) => sum + (d.totalAmount - (d.paidAmount ?? 0)), 0)

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isWholesale: user.isWholesale,
        balance: user.balance,
      },
      totalDebt: totalUnpaidDebt,
      debts: user.debts,
      orders: user.orders,
      transactions: user.transactions,
    })
  } catch (error) {
    console.error('[CUSTOMER_STATEMENT_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}