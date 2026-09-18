import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Public endpoint — session is optional (determines pricing)
  const session = await auth().catch(() => null)

  try {
    const { slug } = await params

    const product = await prisma.product.findUnique({
      where: { slug, isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        price: true,
        b2bPrice: true,
        stock: true,
        images: true,
        createdAt: true,
      },
    })

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    // Determine wholesale pricing
    let isWholesale = false
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isWholesale: true },
      })
      isWholesale = user?.isWholesale ?? false
    }

    const displayPrice = isWholesale
      ? (product.b2bPrice ?? product.price)
      : product.price

    return Response.json({
      ...product,
      price: displayPrice,
      b2bPrice: undefined, // Don't expose raw b2bPrice to public
      inStock: product.stock > 0,
    })
  } catch (error) {
    console.error('[MARKET_PRODUCT_SLUG_GET]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}