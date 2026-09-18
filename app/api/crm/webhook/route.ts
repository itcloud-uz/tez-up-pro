import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { LeadSource } from '@prisma/client'

export async function POST(req: NextRequest) {
  // Public endpoint — no auth required
  try {
    const secret = req.headers.get('x-webhook-secret')

    if (secret !== process.env.WEBHOOK_SECRET) {
      return Response.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    const webhookSource = req.headers.get('x-webhook-source') ?? 'UNKNOWN'
    const rawBody = await req.text()
    let payload: Record<string, unknown> = {}

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Log raw webhook payload regardless of parsing outcome
    const webhookLogPromise = prisma.webhookLog.create({
      data: {
        source: (webhookSource as LeadSource) || 'MANUAL' as LeadSource,
        payload: rawBody,
      },
    })

    // Parse Facebook Lead Ads format
    // { field_data: [{ name: 'full_name', values: ['John'] }, { name: 'phone_number', values: ['+998...'] }] }
    let name = ''
    let phone = ''
    let email: string | null = null

    const fieldData = payload.field_data as
      | Array<{ name: string; values: string[] }>
      | undefined

    if (Array.isArray(fieldData)) {
      for (const field of fieldData) {
        const value = field.values?.[0] ?? ''
        switch (field.name) {
          case 'full_name':
          case 'name':
            name = value
            break
          case 'phone_number':
          case 'phone':
            phone = value
            break
          case 'email':
            email = value || null
            break
        }
      }
    } else {
      // Generic fallback for flat payloads
      name =
        (payload.full_name as string) ??
        (payload.name as string) ??
        'Unknown'
      phone =
        (payload.phone_number as string) ??
        (payload.phone as string) ??
        ''
      email = (payload.email as string) ?? null
    }

    if (!phone) {
      // Still log but don't create lead without phone
      await webhookLogPromise
      return Response.json({ received: true, lead: null })
    }

    // Normalize source to a valid LeadSource enum value, falling back to 'MANUAL'
    const normalizedSource = webhookSource.toUpperCase() as LeadSource

    // Create lead and log in parallel
    const [, lead] = await Promise.all([
      webhookLogPromise,
      prisma.lead.create({
        data: {
          name: name || 'Unknown',
          phone,
          email,
          source: normalizedSource || ('MANUAL' as LeadSource),
          status: 'NEW',
          notes: `Webhook received from ${webhookSource}`,
        },
      }),
    ])

    return Response.json({ received: true, lead: { id: lead.id } })
  } catch (error) {
    console.error('[WEBHOOK_POST]', error)
    // Always return 200 to social media platforms to prevent retries
    return Response.json({ received: true })
  }
}
