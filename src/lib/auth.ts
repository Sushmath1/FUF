import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/college/login' },
  providers: [
    Credentials({
      id: 'college',
      name: 'College',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toString().toLowerCase()
          const password = credentials?.password?.toString()
          if (!email || !password) return null

          const account = await prisma.collegeAccount.findUnique({
            where: { adminEmail: email },
            include: { college: true },
          })
          if (!account) return null

          const valid = await bcrypt.compare(password, account.passwordHash)
          if (!valid) return null

          await prisma.collegeAccount.update({
            where: { id: account.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: account.collegeId,
            email: account.adminEmail,
            name: account.college.name,
            role: 'college',
          }
        } catch (error) {
          console.error('[Auth] College login error:', error)
          return null
        }
      },
    }),
    Credentials({
      id: 'visitor',
      name: 'Visitor',
      credentials: { email: { type: 'email' }, password: { type: 'password' } },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toString().toLowerCase()
          const password = credentials?.password?.toString()
          if (!email || !password) return null

          const account = await prisma.visitorAccount.findUnique({
            where: { email },
            include: { visitor: true },
          })
          if (!account) return null

          const valid = await bcrypt.compare(password, account.passwordHash)
          if (!valid) return null

          return {
            id: account.visitorId,
            email: account.email,
            name: account.visitor.name ?? account.email,
            role: 'visitor',
          }
        } catch (error) {
          console.error('[Auth] Visitor login error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        role: token.role as string,
        id: token.id as string,
      }
      return session
    },
  },
})