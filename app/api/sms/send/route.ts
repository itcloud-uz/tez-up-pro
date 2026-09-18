import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { eskiz } from '@/lib/eskiz'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { phone, message } = body

    if (!phone || !message) {
      return Response.json(
        { error: 'phone and message are required' },
        { status: 400 }
      )
    }

    const result = await eskiz.sendSms(phone, message)

    return Response.json({ success: true, result })
  } catch (error) {
    console.error('[SMS_SEND_POST]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
