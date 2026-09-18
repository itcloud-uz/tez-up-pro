import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Role } from '@prisma/client'

// ─────────────────────────────────────────────
// Role → home panel mapping
// ─────────────────────────────────────────────
const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin',
  EMPLOYEE: '/employee',
  COURIER: '/courier',
  CUSTOMER: '/market',
}

// ─────────────────────────────────────────────
// Route prefix → required role(s)
// ─────────────────────────────────────────────
const PROTECTED_ROUTES: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/employee', roles: ['EMPLOYEE'] },
  { prefix: '/courier', roles: ['COURIER'] },
  // Market is accessible to authenticated users of any role
  { prefix: '/market', roles: ['ADMIN', 'EMPLOYEE', 'COURIER', 'CUSTOMER'] },
]

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl
  const session = (req as any).auth

  // Find the first matching protected route
  const matched = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix))

  if (!matched) {
    // Not a protected route — allow through
    return NextResponse.next()
  }

  // ── Not authenticated ──────────────────────
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role as Role

  // ── Wrong role ─────────────────────────────
  if (!matched.roles.includes(userRole)) {
    // Redirect to the user's correct home panel
    const homeUrl = new URL(ROLE_HOME[userRole] ?? '/login', req.url)
    return NextResponse.redirect(homeUrl)
  }

  // ── Authorised — allow through ─────────────
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - Public API routes that must remain open:
     *   /api/auth/** (NextAuth handlers)
     *   /api/webhooks/** (Facebook/Instagram/TikTok lead webhooks)
     * - Public pages: /, /login, /register
     * - /uploads/** (served product images)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks|uploads|login|register|$).*)',
  ],
}
