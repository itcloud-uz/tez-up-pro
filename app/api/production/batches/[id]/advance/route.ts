import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { advanceBatch } from '@/lib/production'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id: batchId } = await params
    const body = await req.json().catch(() => ({}))
    const notes: string | undefined = body?.notes

    const updatedBatch = await advanceBatch(batchId, session.user.id, notes)

    return Response.json(updatedBatch)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error'

    // advanceBatch throws a descriptive error when batch is COMPLETED
    if (
      message.includes('COMPLETED') ||
      message.toLowerCase().includes('already completed')
    ) {
      return Response.json({ error: message }, { status: 400 })
    }

    if (message.includes('not found') || message.includes('Not found')) {
      return Response.json({ error: message }, { status: 404 })
    }

    console.error('[BATCH_ADVANCE_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}