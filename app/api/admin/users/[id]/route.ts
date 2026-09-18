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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isWholesale: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderStatus: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        debts: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            isPaid: true,
            dueDate: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json(user)
  } catch (error) {
    console.error('[ADMIN_USER_GET]', error)
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
    const { name, phone, email, role, isWholesale } = body

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Check phone uniqueness if changing phone
    if (phone && phone !== existing.phone) {
      const phoneConflict = await prisma.user.findUnique({ where: { phone } })
      if (phoneConflict) {
        return Response.json(
          { error: 'Phone number already in use' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(isWholesale !== undefined && { isWholesale }),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isWholesale: true,
        updatedAt: true,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[ADMIN_USER_PUT]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (user._count.orders > 0) {
      // Soft delete — hard-delete is not possible when orders exist
      // We simply return a conflict since isActive doesn't exist in schema
      return Response.json(
        { error: 'Cannot delete user with existing orders' },
        { status: 409 }
      )
    }

    // Hard delete — no orders
    await prisma.user.delete({ where: { id } })
    return Response.json({ message: 'User deleted' })
  } catch (error) {
    console.error('[ADMIN_USER_DELETE]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}