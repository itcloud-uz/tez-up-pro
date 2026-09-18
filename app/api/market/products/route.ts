import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Public endpoint — session is optional (determines pricing)
  const session = await auth().catch(() => null)

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '24', 10)
    const skip = (page - 1) * limit

    const where = {
      isPublished: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          price: true,
          b2bPrice: true,
          stock: true,
          images: true,
        },
      }),
      prisma.product.count({ where }),
    ])

    // Determine if the session user is a wholesale customer
    let isWholesale = false
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isWholesale: true },
      })
      isWholesale = user?.isWholesale ?? false
    }

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      price: isWholesale ? (p.b2bPrice ?? p.price) : p.price,
      stock: p.stock,
      inStock: p.stock > 0,
      images: p.images,
    }))

    return Response.json({
      data: result,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[MARKET_PRODUCTS_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
