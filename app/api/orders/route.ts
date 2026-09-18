import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { PaymentType, PaymentStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const isAdmin = session.user.role === 'ADMIN'
    const customerId = isAdmin ? undefined : session.user.id

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const skip = (page - 1) * limit

    const where = customerId ? { customerId } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
          debt: { select: { id: true, totalAmount: true, isPaid: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return Response.json({
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[ORDERS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      items,
      deliveryAddress,
      paymentType,
    }: {
      items: Array<{ productId: string; quantity: number }>
      deliveryAddress: string
      paymentType: string
    } = body

    if (!items || items.length === 0) {
      return Response.json({ error: 'items are required' }, { status: 400 })
    }

    // Fetch the customer to determine wholesale pricing
    const customer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, isWholesale: true },
    })

    if (!customer) {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Fetch all products at once
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Validate stock for each item
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return Response.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        )
      }
      if (product.stock < item.quantity) {
        return Response.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
          },
          { status: 400 }
        )
      }
    }

    // Calculate total amount
    let totalAmount = 0
    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)!
      const unitPrice = customer.isWholesale
        ? (product.b2bPrice ?? product.price)
        : product.price
      const subtotal = unitPrice * item.quantity
      totalAmount += subtotal
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      }
    })

    // Create order, decrement stock, and optionally create debt — all in one transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          totalAmount,
          paymentType: paymentType as PaymentType,
          orderStatus: 'PENDING_APPROVAL',
          paymentStatus: 'PENDING' as PaymentStatus,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
            },
          },
        },
      })

      // Decrement stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Create Debt record if payment type is CREDIT
      if (paymentType === 'CREDIT') {
        await tx.debt.create({
          data: {
            customerId: customer.id,
            orderId: newOrder.id,
            totalAmount,
            paidAmount: 0,
            isPaid: false,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        })
      }

      return newOrder
    })

    return Response.json(order, { status: 201 })
  } catch (error) {
    console.error('[ORDERS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
