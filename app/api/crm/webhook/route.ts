import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { LeadSource } from '@prisma/client'

// 1. Meta / Facebook Webhook Verification (GET so'rovi)
// Meta dasturchilar panelida webhook URL kiritilganda Meta ushbu GET so'rov orqali verify qiladi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    // DB dagi token yoki env dagi tokenni tekshiramiz
    const dbTokenSetting = await prisma.systemSetting.findUnique({
      where: { key: 'META_VERIFY_TOKEN' },
    })

    const expectedToken = dbTokenSetting?.value || process.env.META_VERIFY_TOKEN || 'tezup_meta_verify_2026'

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[META_WEBHOOK_VERIFIED] Challenge sent back successfully')
      return new Response(challenge, { status: 200 })
    }

    // Oddiy test uchun json javob
    return Response.json({
      status: 'active',
      message: 'Tez Up Pro CRM Meta Webhook endpoint is running.',
    })
  } catch (error) {
    console.error('[WEBHOOK_VERIFY_ERROR]', error)
    return new Response('Verification failed', { status: 403 })
  }
}

// 2. Lead Ads va Target so'rovlarini qabul qilish (POST so'rovi)
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let payload: Record<string, any> = {}

    try {
      payload = JSON.parse(rawBody)
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Webhook log yozib borish
    await prisma.webhookLog.create({
      data: {
        source: 'FACEBOOK',
        payload: rawBody,
      },
    })

    let name = ''
    let phone = ''
    let email: string | null = null
    let notes: string | null = null
    let source: LeadSource = 'FACEBOOK'

    // Format A: Meta Lead Ads form entry
    // payload: { entry: [{ changes: [{ value: { form_id, leadgen_id, field_data: [...] } }] }] }
    if (Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const val = change.value
            if (val) {
              notes = `Form ID: ${val.form_id || '-'}, Leadgen ID: ${val.leadgen_id || '-'}`
              if (Array.isArray(val.field_data)) {
                for (const field of val.field_data) {
                  const v = Array.isArray(field.values) ? field.values[0] : field.values
                  if (field.name?.includes('name')) name = v
                  if (field.name?.includes('phone')) phone = v
                  if (field.name?.includes('email')) email = v
                }
              }
            }
          }
        }
      }
    }

    // Format B: Oddiy field_data formati
    if (!phone && Array.isArray(payload.field_data)) {
      for (const field of payload.field_data) {
        const value = field.values?.[0] ?? ''
        if (field.name?.includes('name')) name = value
        if (field.name?.includes('phone')) phone = value
        if (field.name?.includes('email')) email = value || null
      }
    }

    // Format C: To'g'ridan-to'g'ri JSON ({ name, phone, email, source, notes })
    if (!phone) {
      name = payload.full_name || payload.name || 'Yangi Target Mijoz'
      phone = payload.phone_number || payload.phone || ''
      email = payload.email || null
      notes = payload.notes || notes
      if (payload.source) source = payload.source as LeadSource
    }

    if (!phone) {
      return Response.json({ received: true, message: 'No phone number found in payload' })
    }

    // Telefon raqamni tozalash
    phone = phone.replace(/[^\d+]/g, '')
    if (!phone.startsWith('+')) {
      if (phone.startsWith('998')) phone = '+' + phone
      else if (phone.length === 9) phone = '+998' + phone
      else phone = '+' + phone
    }

    // Lead yaratish yoki mavjud bo'lsa yangilash
    const lead = await prisma.lead.create({
      data: {
        name: name || 'Target Xaridor',
        phone,
        email,
        source,
        status: 'NEW',
        notes: notes ? `${notes} (Meta Target orqali tushdi)` : 'Meta Target orqali kelib tushdi',
        webhookPayload: payload,
      },
    })

    console.log('[CRM_LEAD_CREATED_FROM_TARGET]', lead.id, lead.name, lead.phone)
    return Response.json({ success: true, leadId: lead.id })
  } catch (error) {
    console.error('[WEBHOOK_POST_ERROR]', error)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}