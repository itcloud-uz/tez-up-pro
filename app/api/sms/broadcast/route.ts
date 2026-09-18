import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { eskiz } from '@/lib/eskiz'

export async function POST(_req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const debts = await prisma.debt.findMany({
      where: { isPaid: false },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    })

    if (debts.length === 0) {
      return Response.json({ sent: 0, failed: 0, message: 'No unpaid debts' })
    }

    const messages = debts.map((debt) => ({
      phone: debt.customer.phone,
      message: `Hurmatli ${debt.customer.name}, sizning ${debt.totalAmount.toLocaleString('uz-UZ')} UZS qarzingiz bor. Iltimos, to'lang. Tez Up Pro`,
      debtId: debt.id,
    }))

    const bulkResult = await eskiz.sendBulk(
      messages.map((m) => ({ phone: m.phone, message: m.message }))
    )

    // Count successes and failures from results array
    const sentCount = bulkResult.results.filter((r: { success?: boolean }) => r.success !== false).length
    const failedCount = bulkResult.results.length - sentCount
    const sent = bulkResult.success ? sentCount : 0
    const failed = bulkResult.success ? failedCount : debts.length

    // Update reminder fields for all debts
    const now = new Date()
    await prisma.debt.updateMany({
      where: {
        id: { in: debts.map((d) => d.id) },
        isPaid: false,
      },
      data: {
        lastReminderAt: now,
        reminderCount: { increment: 1 },
      },
    })

    return Response.json({
      sent,
      failed,
      total: debts.length,
    })
  } catch (error) {
    console.error('[SMS_BROADCAST_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
