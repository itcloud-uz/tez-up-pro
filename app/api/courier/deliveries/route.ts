import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'COURIER'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const isAdmin = session.user.role === 'ADMIN'

    const deliveries = await prisma.delivery.findMany({
      where: isAdmin ? {} : { courierId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            items: {
              include: {
                product: { select: { id: true, name: true } },
              },
            },
          },
        },
        courier: { select: { id: true, name: true, phone: true } },
      },
    })

    return Response.json(deliveries)
  } catch (error) {
    console.error('[DELIVERIES_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
