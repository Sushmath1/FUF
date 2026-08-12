# PROMPT: Fix auth error and sync files from FUF/ to root

## Context
This project has a duplicate folder issue. The actual running project is at the root
(c:\Users\padke\OneDrive\Documents\fuf\) but previous changes were accidentally applied
to a subfolder called FUF/ instead. This prompt fixes everything.

## STEP 1: Copy all changed files from FUF/ to root

Copy these files from FUF/ to the correct root location:

1. Copy FUF/src/app/api/auth/[...nextauth]/route.ts 
   → src/app/api/auth/[...nextauth]/route.ts

2. Copy FUF/src/app/college/register/page.tsx 
   → src/app/college/register/page.tsx

3. Copy FUF/src/app/globals.css 
   → src/app/globals.css

## STEP 2: Fix the auth route at root

Make sure src/app/api/auth/[...nextauth]/route.ts contains exactly this:

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
export const runtime = 'nodejs'
```

## STEP 3: Fix src/lib/auth.ts at root

Make sure src/lib/auth.ts has proper NextAuth v5 beta setup:

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/college/login' },
  providers: [
    Credentials({
      id: 'college',
      name: 'College',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const account = await prisma.collegeAccount.findUnique({
            where: { adminEmail: credentials.email as string },
            include: { college: true },
          })
          if (!account) return null
          const valid = await bcrypt.compare(
            credentials.password as string,
            account.passwordHash
          )
          if (!valid) return null
          return {
            id: account.collegeId,
            email: account.adminEmail,
            name: account.college.name,
            role: 'college',
          }
        } catch (e) {
          console.error('[Auth] College login error:', e)
          return null
        }
      },
    }),
    Credentials({
      id: 'visitor',
      name: 'Visitor',
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const account = await prisma.visitorAccount.findUnique({
            where: { email: credentials.email as string },
            include: { visitor: true },
          })
          if (!account) return null
          const valid = await bcrypt.compare(
            credentials.password as string,
            account.passwordHash
          )
          if (!valid) return null
          return {
            id: account.visitorId,
            email: account.email,
            name: account.visitor.name ?? account.email,
            role: 'visitor',
          }
        } catch (e) {
          console.error('[Auth] Visitor login error:', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role as string
      session.user.id = token.id as string
      return session
    },
  },
})
```

## STEP 4: Create .env.local at the ROOT (not inside FUF/)

Create the file at: c:\Users\padke\OneDrive\Documents\fuf\.env.local

Content:
```
DATABASE_URL=paste_your_neon_connection_string_here
NEXTAUTH_SECRET=findurfestsupersecretkey2026xyzabc
NEXTAUTH_URL=http://localhost:3000
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
ANTHROPIC_API_KEY=
```

IMPORTANT: Replace paste_your_neon_connection_string_here with the actual Neon 
connection string. It looks like:
postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

## STEP 5: Run prisma generate at root

```bash
npx prisma generate
```

## STEP 6: Delete the FUF/ subfolder

Delete the entire FUF/ directory to avoid confusion:

```bash
Remove-Item -Recurse -Force FUF
```

## STEP 7: Verify the fix

Run the dev server:
```bash
npm run dev
```

Then open the browser and go to:
http://localhost:3000/api/auth/session

It should return JSON like: {} or {"user":null}
It must NOT return an HTML page with DOCTYPE.

If it returns JSON — the auth error is fixed.
If it still returns HTML — check that NEXTAUTH_SECRET and NEXTAUTH_URL are set 
correctly in .env.local at the root.

## STEP 8: Confirm everything works

Check these pages load without console errors:
- http://localhost:3000 (landing page)
- http://localhost:3000/college/login (login form)
- http://localhost:3000/visitor/search (search page)

Open browser DevTools (F12) → Console tab — there should be no red 
ClientFetchError errors after this fix.

## After all steps are complete

Report back which steps completed successfully and which had issues.
Do NOT make any other changes — only fix what is listed above.
