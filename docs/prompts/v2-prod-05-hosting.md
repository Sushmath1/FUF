# PROMPT 5: Hosting + Deployment
# FindUrFest — Full production build

## Accounts needed
1. GitHub — already have
2. Vercel — vercel.com (sign in with GitHub)
3. Neon — neon.tech (free, no card)
4. Pusher — pusher.com (free, 200 concurrent connections — enough for a college fest)
5. Anthropic — console.anthropic.com (for AI features — add a small credit, $5 lasts a long time for a college fest)

---

## STEP 1: Neon database
1. neon.tech → New Project → name: "findurf est-prod" → Region: Singapore (ap-southeast-1)
2. Copy the connection string (your DATABASE_URL)

## STEP 2: Pusher
1. pusher.com → Create Channels app → Cluster: ap2
2. Copy: App ID, Key, Secret

## STEP 3: Generate NEXTAUTH_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## STEP 4: Push to GitHub
```bash
git add .
git commit -m "ready for production"
git push origin main
```

## STEP 5: Deploy to Vercel
1. vercel.com → Add New Project → import FindUrFest repo
2. BEFORE clicking Deploy → Environment Variables → add ALL of these:

| Variable | Value |
|---|---|
| DATABASE_URL | Neon connection string |
| NEXTAUTH_SECRET | generated above |
| NEXTAUTH_URL | https://your-project.vercel.app (update after first deploy) |
| PUSHER_APP_ID | from Pusher |
| PUSHER_KEY | from Pusher |
| PUSHER_SECRET | from Pusher |
| PUSHER_CLUSTER | ap2 |
| NEXT_PUBLIC_PUSHER_KEY | same as PUSHER_KEY |
| NEXT_PUBLIC_PUSHER_CLUSTER | ap2 |
| ANTHROPIC_API_KEY | from console.anthropic.com |
| NODE_ENV | production |

3. Deploy → wait 3 minutes → copy your live URL

## STEP 6: Update NEXTAUTH_URL
Vercel → Settings → Environment Variables → update NEXTAUTH_URL to your actual live URL → Redeploy

## STEP 7: Run database migrations
```powershell
$env:DATABASE_URL="your_neon_connection_string"
npx prisma db push
Remove-Item Env:DATABASE_URL
```

## STEP 8: Add security headers to next.config.ts
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }]
  },
}

export default nextConfig
```

---

## Pre-fest checklist (do this 2 days before — not the day of)

**Core flow:**
- [ ] College can register and login
- [ ] College can add buildings and venues
- [ ] College can add events, change venue, cancel event
- [ ] College can upload CSV and see matched/unmatched counts
- [ ] Visitor can search and find the college
- [ ] Visitor verifies with email or phone — finds their events
- [ ] Visitor schedule shows correctly
- [ ] College changes venue → visitor gets toast within 3 seconds
- [ ] College cancels event → visitor sees "Cancelled" card

**AI features:**
- [ ] College types theme description → AI generates palette → colors apply to the UI
- [ ] Visitor chatbot answers a question about their schedule correctly
- [ ] Auto-schedule generates a sensible event list from interests
- [ ] Recommendations show up below the schedule

**Map:**
- [ ] Map loads at /visitor/map?collegeId=...
- [ ] Building pins show on the real map
- [ ] "Get route" draws a blue line after GPS permission
- [ ] Floor plan shows when building is selected, room pins are visible

**Mobile (most visitors will use a phone):**
- [ ] Landing page looks great on phone
- [ ] Schedule is readable, tap targets are big enough
- [ ] Chat button doesn't cover event cards

**Reliability:**
- [ ] Turn wifi off → schedule still shows with offline banner
- [ ] Open the app in 10 tabs simultaneously → no crashes

---

## On fest day — keep these open on a laptop

1. **Vercel → Functions tab** — shows API errors in real time
2. **Pusher → Debug Console** — confirms venue-changed events are going out
3. **Neon → Monitoring** — shows database connections
4. **The app on your own phone** — be a test visitor throughout the day

---

## Backup plan (always have one)

Before the fest starts:
1. Screenshot or PDF of the full event schedule — give to the fest coordinator
2. Create a WhatsApp broadcast list with all registered numbers as a fallback channel
3. Know that Vercel → Redeploy fixes most issues in under 2 minutes

---

## Custom domain (optional — makes it look official)

Ask your college IT team to create a subdomain like fest.citchennai.net
1. Vercel → Settings → Domains → add the subdomain
2. Vercel gives DNS records (CNAME + TXT)
3. IT team adds them to DNS
4. HTTPS is automatic

`git add . && git commit -m "production deployment complete"`
