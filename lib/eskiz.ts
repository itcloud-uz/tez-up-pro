/**
 * Eskiz.uz SMS API Client
 *
 * Base URL : https://notify.eskiz.uz/api/
 * Auth     : POST /auth/login  { email, password } → { data: { token } }
 * Send SMS : POST /message/sms/send { mobile_phone, message, from, callback_url }
 * Bulk SMS : POST /message/sms/send-batch
 * Refresh  : PATCH /auth/refresh (Bearer <token>)
 */

import { prisma } from '@/lib/prisma'
import { SmsStatus } from '@prisma/client'

const BASE_URL = 'https://notify.eskiz.uz/api'

interface EskizAuthResponse {
  data: {
    token: string
    token_type: string
  }
  message: string
  status: string
}

interface EskizSendResponse {
  id: string
  status: string
  message?: string
}

interface EskizBulkItem {
  phone: string
  message: string
}

export class EskizClient {
  private email: string | null = null
  private password: string | null = null
  private senderName: string | null = null
  private token: string | null = null
  private tokenExpiresAt: Date | null = null

  constructor(email?: string, password?: string, senderName?: string) {
    this.email = email || null
    this.password = password || null
    this.senderName = senderName || null
  }

  /**
   * Lazily loads credentials from DB (SystemSetting table) if not passed in env or constructor
   */
  private async getCredentials(): Promise<{ email: string; password: string; senderName: string }> {
    let email = this.email || process.env.ESKIZ_EMAIL || ''
    let password = this.password || process.env.ESKIZ_PASSWORD || ''
    let senderName = this.senderName || process.env.ESKIZ_SENDER || '4546'

    if (!email || !password) {
      try {
        const settings = await prisma.systemSetting.findMany({
          where: { key: { in: ['ESKIZ_EMAIL', 'ESKIZ_PASSWORD', 'ESKIZ_SENDER'] } },
        })
        const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
        if (map['ESKIZ_EMAIL']) email = map['ESKIZ_EMAIL']
        if (map['ESKIZ_PASSWORD']) password = map['ESKIZ_PASSWORD']
        if (map['ESKIZ_SENDER']) senderName = map['ESKIZ_SENDER']
      } catch (err) {
        console.error('[EskizClient] Error loading credentials from DB:', err)
      }
    }

    if (!email || !password) {
      throw new Error('Eskiz email yoki parol sozlanmagan. Tizim sozlamalaridan kiriting.')
    }

    return { email, password, senderName }
  }

  // ──────────────────────────────────────────────
  // Token management
  // ──────────────────────────────────────────────

  /**
   * Returns a valid token, fetching or refreshing as needed.
   * Tokens are cached in memory and refreshed before expiry.
   */
  private async getToken(): Promise<string> {
    const now = new Date()

    // If token is valid and not expiring within the next 5 minutes, reuse it
    if (
      this.token &&
      this.tokenExpiresAt &&
      this.tokenExpiresAt.getTime() - now.getTime() > 5 * 60 * 1000
    ) {
      return this.token
    }

    // Try refresh first if we already have a token
    if (this.token) {
      try {
        const refreshed = await this.refreshToken()
        if (refreshed) return this.token!
      } catch {
        // Refresh failed — fall through to full login
      }
    }

    return this.login()
  }

  /** Full login — fetches a new token using email/password. */
  private async login(): Promise<string> {
    const creds = await this.getCredentials()

    const formData = new FormData()
    formData.append('email', creds.email)
    formData.append('password', creds.password)

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Eskiz login failed: ${response.status} ${response.statusText}`)
    }

    const data: EskizAuthResponse = await response.json()

    if (!data.data?.token) {
      throw new Error(`Eskiz login failed: no token in response — ${data.message}`)
    }

    this.token = data.data.token
    // Eskiz tokens are valid for 30 days; cache for 29 days to be safe
    this.tokenExpiresAt = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)

    return this.token
  }

  /** Refreshes the existing token. Returns true on success. */
  private async refreshToken(): Promise<boolean> {
    if (!this.token) return false

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    })

    if (!response.ok) return false

    const data: EskizAuthResponse = await response.json()

    if (!data.data?.token) return false

    this.token = data.data.token
    this.tokenExpiresAt = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    return true
  }

  // ──────────────────────────────────────────────
  // Phone normalisation
  // ──────────────────────────────────────────────

  /**
   * Normalises any Uzbek phone string to the 998XXXXXXXXX format (12 digits, no +).
   * Eskiz requires the phone in this format.
   */
  private normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, '')

    if (digits.startsWith('998') && digits.length === 12) return digits
    if (digits.startsWith('8') && digits.length === 11) return `998${digits.slice(1)}`
    if (digits.startsWith('0') && digits.length === 11) return `998${digits.slice(1)}`
    if (digits.length === 9) return `998${digits}`

    return digits
  }

  // ──────────────────────────────────────────────
  // Single SMS
  // ──────────────────────────────────────────────

  /**
   * Sends a single SMS message to the given phone number.
   * Logs the attempt to the SmsLog table.
   */
  async sendSms(
    phone: string,
    message: string,
    sentById?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const normalized = this.normalizePhone(phone)

    // Create a pending log entry first
    const smsLog = await prisma.smsLog.create({
      data: {
        recipientPhone: phone,
        message,
        status: SmsStatus.PENDING,
        sentById: sentById ?? null,
      },
    })

    try {
      const creds = await this.getCredentials()
      const token = await this.getToken()

      const formData = new FormData()
      formData.append('mobile_phone', normalized)
      formData.append('message', message)
      formData.append('from', creds.senderName)
      // Optional: callback URL for delivery receipts
      if (process.env.ESKIZ_CALLBACK_URL) {
        formData.append('callback_url', process.env.ESKIZ_CALLBACK_URL)
      }

      const response = await fetch(`${BASE_URL}/message/sms/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      // Handle 401 — token may have been invalidated server-side
      if (response.status === 401) {
        this.token = null
        this.tokenExpiresAt = null
        throw new Error('Eskiz token expired or invalid — will retry on next call')
      }

      if (!response.ok) {
        throw new Error(`Eskiz API error: ${response.status} ${response.statusText}`)
      }

      const data: EskizSendResponse = await response.json()

      // Update log to SENT
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: {
          status: SmsStatus.SENT,
          eskizMessageId: data.id ?? null,
        },
      })

      return { success: true, messageId: data.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update log to FAILED
      await prisma.smsLog.update({
        where: { id: smsLog.id },
        data: { status: SmsStatus.FAILED },
      })

      console.error('[EskizClient] sendSms failed:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // ──────────────────────────────────────────────
  // Bulk SMS
  // ──────────────────────────────────────────────

  /**
   * Sends multiple SMS messages in a single API call.
   * Each message can have its own phone and text.
   */
  async sendBulk(
    messages: EskizBulkItem[],
    sentById?: string,
  ): Promise<{ success: boolean; results: any[] }> {
    if (messages.length === 0) {
      return { success: true, results: [] }
    }

    // Create pending log entries for all messages
    const logIds = await Promise.all(
      messages.map((m) =>
        prisma.smsLog.create({
          data: {
            recipientPhone: m.phone,
            message: m.message,
            status: SmsStatus.PENDING,
            sentById: sentById ?? null,
          },
          select: { id: true },
        }),
      ),
    )

    try {
      const creds = await this.getCredentials()
      const token = await this.getToken()

      // Eskiz bulk format: array of { user_sms_id, to, text }
      const payload = messages.map((m, i) => ({
        user_sms_id: logIds[i].id, // use our DB id as correlation id
        to: this.normalizePhone(m.phone),
        text: m.message,
      }))

      const response = await fetch(`${BASE_URL}/message/sms/send-batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payload,
          from: creds.senderName,
        }),
      })

      if (response.status === 401) {
        this.token = null
        this.tokenExpiresAt = null
        throw new Error('Eskiz token expired — will retry on next call')
      }

      if (!response.ok) {
        throw new Error(`Eskiz sendBatch failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const results = Array.isArray(data.data) ? data.data : []

      // Mark each log as SENT with its respective Eskiz message ID
      await Promise.all(
        logIds.map((l, i) =>
          prisma.smsLog.update({
            where: { id: l.id },
            data: {
              status: SmsStatus.SENT,
              eskizMessageId: results[i]?.id ?? null,
            },
          }),
        ),
      )

      return { success: true, results }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Mark all as failed
      await Promise.all(
        logIds.map((l) =>
          prisma.smsLog.update({
            where: { id: l.id },
            data: { status: SmsStatus.FAILED },
          }),
        ),
      )

      console.error('[EskizClient] sendBulk failed:', errorMessage)
      return { success: false, results: [] }
    }
  }
}

// ──────────────────────────────────────────────
// Singleton export
// ──────────────────────────────────────────────

export const eskiz = new EskizClient()
