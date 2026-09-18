import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const materialId = searchParams.get('materialId') ?? undefined

    const fabricRolls = await prisma.fabricRoll.findMany({
      where: materialId ? { materialId } : undefined,
      orderBy: { receivedAt: 'desc' },
      include: {
        material: {
          select: { id: true, name: true, unit: true },
        },
      },
    })

    return Response.json(fabricRolls)
  } catch (error) {
    console.error('[FABRIC_ROLLS_GET]', error)
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
    const { materialId, rollNumber, totalMeters, notes } = body

    if (!materialId || !rollNumber || totalMeters === undefined) {
      return Response.json(
        { error: 'materialId, rollNumber, and totalMeters are required' },
        { status: 400 }
      )
    }

    const material = await prisma.rawMaterial.findUnique({
      where: { id: materialId },
    })

    if (!material) {
      return Response.json({ error: 'Material not found' }, { status: 404 })
    }

    // Create roll and increment material stock in a transaction
    const [fabricRoll] = await prisma.$transaction([
      prisma.fabricRoll.create({
        data: {
          materialId,
          rollNumber: String(rollNumber),
          totalMeters: Number(totalMeters),
          usedMeters: 0,
          notes: notes ?? null,
        },
        include: {
          material: { select: { id: true, name: true, unit: true } },
        },
      }),
      prisma.rawMaterial.update({
        where: { id: materialId },
        data: { currentStock: { increment: Number(totalMeters) } },
      }),
    ])

    return Response.json(fabricRoll, { status: 201 })
  } catch (error) {
    console.error('[FABRIC_ROLLS_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}