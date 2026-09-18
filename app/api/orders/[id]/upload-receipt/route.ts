import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, customerId: true, orderStatus: true },
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // Customer can only upload for their own order
    if (
      session.user.role === 'CUSTOMER' &&
      order.customerId !== session.user.id
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('receipt') as File | null

    if (!file) {
      return Response.json(
        { error: 'receipt file field is required' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json(
        { error: 'Only JPEG and PNG images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: 'File size must not exceed 5MB' },
        { status: 400 }
      )
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const filename = `${randomUUID()}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts')
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), buffer)

    const receiptUrl = `/uploads/receipts/${filename}`

    await prisma.order.update({
      where: { id },
      data: {
        receiptUrl,
        orderStatus: 'PENDING_APPROVAL',
      },
    })

    return Response.json({ receiptUrl })
  } catch (error) {
    console.error('[UPLOAD_RECEIPT_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}