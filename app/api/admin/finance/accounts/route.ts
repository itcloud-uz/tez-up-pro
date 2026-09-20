import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 1. Asosiy kassa mavjudligini ta'minlash
    let mainCash = await prisma.cashAccount.findFirst({
      where: { name: 'Asosiy Kassa' },
    })

    if (!mainCash) {
      mainCash = await prisma.cashAccount.create({
        data: {
          name: 'Asosiy Kassa',
          type: 'CASH',
          balance: 0,
          notes: 'Kompaniya bosh naqd kassasi',
        },
      })
    }

    let bankAccount = await prisma.cashAccount.findFirst({
      where: { name: 'Bank Hisobi' },
    })

    if (!bankAccount) {
      bankAccount = await prisma.cashAccount.create({
        data: {
          name: 'Bank Hisobi',
          type: 'BANK',
          balance: 0,
          notes: 'Rasmiy hisob raqam / Karta',
        },
      })
    }

    const accounts = await prisma.cashAccount.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        _count: { select: { transactions: true } },
      },
    })

    return Response.json(accounts)
  } catch (error) {
    console.error('[FINANCE_ACCOUNTS_GET]', error)
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
    const { name, type, initialBalance = 0, userId, notes } = body

    if (!name) {
      return Response.json({ error: 'Kassa nomi kiritilishi shart' }, { status: 400 })
    }

    const account = await prisma.cashAccount.create({
      data: {
        name,
        type: type || 'CASH',
        balance: Number(initialBalance) || 0,
        userId: userId || null,
        notes: notes || null,
      },
    })

    return Response.json(account)
  } catch (error) {
    console.error('[FINANCE_ACCOUNTS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}