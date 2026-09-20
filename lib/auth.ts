import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'

// Extend NextAuth types to include role and phone
declare module 'next-auth' {
  interface User {
    role: Role
    phone: string
    isWholesale?: boolean
  }
  interface Session {
    user: {
      id: string
      name: string
      email?: string | null
      phone: string
      role: Role
      isWholesale?: boolean
    }
  }
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    Credentials({
      name: 'Phone & Password',
      credentials: {
        phone: { label: 'Phone', type: 'tel', placeholder: '+998901234567' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Telefon raqam va parol kiritilishi shart')
        }

        const phone = String(credentials.phone).trim()
        const password = String(credentials.password)

        const user = await prisma.user.findUnique({
          where: { phone },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            passwordHash: true,
            role: true,
            isWholesale: true,
          },
        })

        if (!user) {
          throw new Error('Foydalanuvchi topilmadi')
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
          throw new Error("Parol noto'g'ri")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          phone: user.phone,
          role: user.role,
          isWholesale: user.isWholesale,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.name = user.name as string
        token.role = (user as { role: Role }).role
        token.phone = (user as { phone: string }).phone
        token.isWholesale = (user as { isWholesale?: boolean }).isWholesale ?? false
      }
      return token
    },

    async session({ session, token }) {
      session.user.id = (token.id as string) ?? ''
      session.user.name = (token.name as string) ?? ''
      session.user.role = (token.role as Role)
      session.user.phone = (token.phone as string) ?? ''
      session.user.isWholesale = (token.isWholesale as boolean) ?? false
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
export const authOptions = authConfig