import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { eskiz } from '@/lib/eskiz'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ debtId: string }> }
) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { debtId } = await params

    const debt = await prisma.debt.findUnique({
      where: { id: debtId },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        order: { select: { id: true, totalAmount: true } },
      },
    })

    if (!debt) {
      return Response.json({ error: 'Debt not found' }, { status: 404 })
    }

    if (debt.isPaid) {
      return Response.json(
        { error: 'This debt is already paid' },
        { status: 400 }
      )
    }

    const remainingAmount = debt.totalAmount - (debt.paidAmount ?? 0)
    const message = `Hurmatli ${debt.customer.name}, sizning ${remainingAmount.toLocaleString('uz-UZ')} UZS qarzingiz bor. Iltimos, imkon qadar tezroq to'lang. Tez Up Pro`

    const result = await eskiz.sendSms(debt.customer.phone, message)

    await prisma.debt.update({
      where: { id: debtId },
      data: {
        lastReminderAt: new Date(),
        reminderCount: { increment: 1 },
      },
    })

    return Response.json({
      success: true,
      phone: debt.customer.phone,
      message,
      result,
    })
  } catch (error) {
    console.error('[SMS_REMINDER_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}