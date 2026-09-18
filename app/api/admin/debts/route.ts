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
    const isPaidParam = searchParams.get('isPaid')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const skip = (page - 1) * limit

    const where = {
      ...(isPaidParam !== null && {
        isPaid: isPaidParam === 'true',
      }),
    }

    const [debts, total] = await Promise.all([
      prisma.debt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          order: {
            select: {
              id: true,
              orderStatus: true,
              paymentType: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.debt.count({ where }),
    ])

    return Response.json({
      data: debts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[DEBTS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
