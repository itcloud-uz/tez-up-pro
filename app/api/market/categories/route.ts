import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    })
    const categories = products.map((p) => p.category).filter(Boolean)
    return Response.json(categories)
  } catch (error) {
    console.error('[CATEGORIES_GET]', error)
    return Response.json([])
  }
}