import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─────────────────────────────────────────────
// Tailwind class merger
// ─────────────────────────────────────────────

/**
 * Merges Tailwind class names using clsx + tailwind-merge.
 * Resolves conflicting utility classes correctly.
 * @example cn('px-2 py-1', condition && 'bg-orange-500', 'px-4') → 'py-1 bg-orange-500 px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ─────────────────────────────────────────────
// Currency
// ─────────────────────────────────────────────

/**
 * Formats a number as Uzbek-style currency with non-breaking space thousands separator.
 * @example formatCurrency(85000)          → "85 000 UZS"
 * @example formatCurrency(1250000, "som") → "1 250 000 som"
 */
export function formatCurrency(amount: number, currency = 'UZS'): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') // non-breaking space
  return `${formatted} ${currency}`
}

// ─────────────────────────────────────────────
// Phone
// ─────────────────────────────────────────────

/**
 * Normalises any Uzbek phone number to 998XXXXXXXXX format (12 digits, no prefix symbols).
 * Handles +998, 998, 8XX, 0XX, and 9-digit bare formats.
 */
export function normalizeUzbekPhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')

  if (digits.startsWith('998') && digits.length === 12) return digits
  if (digits.startsWith('8') && digits.length === 11) return `998${digits.slice(1)}`
  if (digits.startsWith('0') && digits.length === 11) return `998${digits.slice(1)}`
  if (digits.length === 9) return `998${digits}`

  return digits // fallback: return what we have
}

/**
 * Formats an Uzbek phone number to "+998 (XX) XXX-XX-XX" display format.
 * @example formatPhone('+998901234567') → "+998 (90) 123-45-67"
 */
export function formatPhone(phone: string): string {
  const n = normalizeUzbekPhone(phone)
  if (n.length !== 12) return phone // unrecognised — return as-is

  const cc = n.slice(0, 3)   // 998
  const op = n.slice(3, 5)   // 2-digit operator code
  const p1 = n.slice(5, 8)   // 3 digits
  const p2 = n.slice(8, 10)  // 2 digits
  const p3 = n.slice(10, 12) // 2 digits

  return `+${cc} (${op}) ${p1}-${p2}-${p3}`
}

// ─────────────────────────────────────────────
// Date & Time
// ─────────────────────────────────────────────

/**
 * Formats a date in long Uzbek locale format.
 * @example formatDate(new Date('2026-09-19')) → "19 sentabr 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Returns a human-readable relative time string in Uzbek.
 * @example formatRelativeTime(twoHoursAgo) → "2 soat oldin"
 * @example formatRelativeTime(now)         → "Hozirgina"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'Hozirgina'
  if (diffMin < 60) return `${diffMin} daqiqa oldin`
  if (diffHour < 24) return `${diffHour} soat oldin`
  if (diffDay < 7) return `${diffDay} kun oldin`
  if (diffWeek < 4) return `${diffWeek} hafta oldin`
  if (diffMonth < 12) return `${diffMonth} oy oldin`
  return `${diffYear} yil oldin`
}

// ─────────────────────────────────────────────
// Slug
// ─────────────────────────────────────────────

/** Cyrillic → Latin transliteration map for Uzbek characters. */
const CYR_TO_LAT: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'sh', 'ъ': '', 'ы': 'i', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  'ў': 'o', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h',
  // Common Uzbek Latin special chars already handled, but apostrophes:
  '\u2018': '', '\u2019': '', "'": '',
}

/**
 * Generates a URL-safe slug from a product name.
 * Handles Uzbek Cyrillic and Latin characters.
 * @example generateSlug('Yostiq Chehol') → 'yostiq-chehol'
 * @example generateSlug('Болалар Ёстиғи') → 'bolalar-yostigi'
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map((ch) => CYR_TO_LAT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except space/hyphen
    .trim()
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // strip leading/trailing hyphens
}

// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[]
  total: number
  pages: number
  currentPage: number
  perPage: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Paginates an in-memory array. Pages are 1-indexed.
 *
 * For DB-level pagination, use Prisma's skip/take instead.
 *
 * @param array   - The full array to paginate
 * @param page    - Current page (1-indexed)
 * @param perPage - Number of items per page
 *
 * @example
 * const result = paginate(allProducts, 2, 10)
 * // { data: [...10 items], total: 47, pages: 5, currentPage: 2, ... }
 */
export function paginate<T>(
  array: T[],
  page: number,
  perPage: number,
): PaginatedResult<T> {
  const safePage = Math.max(1, Math.floor(page))
  const safePerPage = Math.max(1, Math.floor(perPage))
  const total = array.length
  const pages = Math.max(1, Math.ceil(total / safePerPage))
  const start = (safePage - 1) * safePerPage
  const data = array.slice(start, start + safePerPage)

  return {
    data,
    total,
    pages,
    currentPage: safePage,
    perPage: safePerPage,
    hasNext: safePage < pages,
    hasPrev: safePage > 1,
  }
}

// ─────────────────────────────────────────────
// Miscellaneous helpers
// ─────────────────────────────────────────────

/**
 * Truncates a string to `maxLength` characters, appending "…" if truncated.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

/**
 * Capitalises the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Returns true if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
