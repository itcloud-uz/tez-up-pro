import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { eskiz } from '@/lib/eskiz'

export async function GET(_req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const logs = await prisma.smsLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const formatted = logs.map((l) => ({
      id: l.id,
      to: l.recipientPhone,
      message: l.message,
      status: l.status.toLowerCase(),
      sentAt: l.createdAt.toISOString(),
    }))

    return Response.json(formatted)
  } catch (error) {
    console.error('[SMS_GET]', error)
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
    const { target, phone, message } = body

    if (!message) {
      return Response.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    if (target === 'all_debtors') {
      const debts = await prisma.debt.findMany({
        where: { isPaid: false },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
      })

      if (debts.length === 0) {
        return Response.json({ success: true, count: 0, message: 'Qarzdorlar topilmadi' })
      }

      const bulkResult = await eskiz.sendBulk(
        debts.map((d) => ({
          phone: d.customer.phone,
          message: message.replace('{name}', d.customer.name).replace('{amount}', d.totalAmount.toString()),
        })),
        session.user.id
      )

      return Response.json({ success: true, count: debts.length, bulkResult })
    }

    // Maxsus raqam
    if (!phone) {
      return Response.json(
        { error: 'Telefon raqam kiritilishi shart' },
        { status: 400 }
      )
    }

    const result = await eskiz.sendSms(phone, message, session.user.id)

    return Response.json({ success: true, count: 1, result })
  } catch (error: any) {
    console.error('[SMS_SEND_POST]', error)
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
