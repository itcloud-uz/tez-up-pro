import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import type { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const roleParam = searchParams.get('role')
    const role = roleParam ? (roleParam as Role) : undefined
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const skip = (page - 1) * limit

    const where = role ? { role } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isWholesale: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return Response.json({
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[ADMIN_USERS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { name, phone, email, password, role, isWholesale } = body

    if (!name || !phone || !password) {
      return Response.json(
        { error: 'name, phone, and password are required' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return Response.json(
        { error: 'A user with this phone number already exists' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: email ?? null,
        passwordHash,
        role: role ?? 'CUSTOMER',
        isWholesale: isWholesale ?? false,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isWholesale: true,
        createdAt: true,
      },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('[ADMIN_USERS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}