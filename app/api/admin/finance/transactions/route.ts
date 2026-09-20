import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { TransactionType, TransactionCategory, PaymentType } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)

    const where: any = {}
    if (accountId) where.accountId = accountId
    if (userId) where.userId = userId
    if (type) where.type = type as TransactionType

    const transactions = await prisma.transaction.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, name: true, type: true } },
        user: { select: { id: true, name: true, phone: true } },
        order: { select: { id: true, totalAmount: true } },
      },
    })

    return Response.json(transactions)
  } catch (error) {
    console.error('[FINANCE_TRANSACTIONS_GET]', error)
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
    const {
      type, // INCOME | EXPENSE
      category = 'OTHER',
      amount,
      accountId,
      userId,
      orderId,
      paymentMethod = 'CASH',
      details, // metr, mahsulot dona, nasiya tafsiloti
      notes,
    } = body

    const numAmount = Number(amount)
    if (!type || !numAmount || numAmount <= 0 || !accountId) {
      return Response.json(
        { error: 'Tranzaksiya turi, summa va kassa tanlanishi shart' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Tranzaksiya yaratish
      const txn = await tx.transaction.create({
        data: {
          type: type as TransactionType,
          category: category as TransactionCategory,
          amount: numAmount,
          accountId,
          userId: userId || null,
          orderId: orderId || null,
          paymentMethod: paymentMethod as PaymentType,
          details: details || null,
          notes: notes || null,
          createdById: session.user.id,
        },
        include: {
          account: true,
          user: true,
        },
      })

      // 2. Kassa balansini yangilash
      const balanceChange = type === 'INCOME' ? numAmount : -numAmount
      await tx.cashAccount.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      })

      // 3. Agar mijoz/shaxs ko'rsatilgan bo'lsa, uning balansini yangilash
      // INCOME (shaxs bizga pul berdi) => uning balansi ortadi (qarzi kamayadi yoki avansi ko'payadi)
      // EXPENSE (biz shaxsga to'ladik / chiqim) => uning balansi kamayadi
      if (userId) {
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        })

        // Agar qarz to'lovi bo'lsa, eng eski to'lanmagan qarzni yopish
        if (type === 'INCOME' && (category === 'DEBT_PAYMENT' || category === 'ORDER_PAYMENT')) {
          let remainingPayment = numAmount
          const unpaidDebts = await tx.debt.findMany({
            where: { customerId: userId, isPaid: false },
            orderBy: { createdAt: 'asc' },
          })

          for (const debt of unpaidDebts) {
            if (remainingPayment <= 0) break
            const debtRemaining = debt.totalAmount - debt.paidAmount
            const payThis = Math.min(debtRemaining, remainingPayment)
            const newPaid = debt.paidAmount + payThis
            const isNowPaid = newPaid >= debt.totalAmount

            await tx.debt.update({
              where: { id: debt.id },
              data: {
                paidAmount: newPaid,
                isPaid: isNowPaid,
              },
            })

            // Agar qarz buyurtmaga ulangan bo'lsa, buyurtma holatini yangilash
            if (isNowPaid && debt.orderId) {
              await tx.order.update({
                where: { id: debt.orderId },
                data: { paymentStatus: 'PAID' },
              })
            }

            remainingPayment -= payThis
          }
        }
      }

      return txn
    })

    return Response.json(result)
  } catch (error) {
    console.error('[FINANCE_TRANSACTIONS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}