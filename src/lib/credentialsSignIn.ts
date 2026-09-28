// next-auth/react's signIn() re-fetches /api/auth/csrf itself on every call. That
// fetch can race against SessionProvider's own background session resync (which
// fires after any signIn attempt, success or fail) — each side can mint its own
// CSRF cookie/token pair, and if they don't land in the order the code expects,
// the token submitted no longer matches the cookie the server checks against,
// so a login that used the exact right password still comes back as CredentialsSignin.
// This is most visible on a retry right after a failed attempt — completely normal
// usage. Fetching the token and posting the credentials in one uninterrupted step,
// without going through signIn()'s own internal refetch, removes that race.
export async function credentialsSignIn(provider: string, email: string, password: string, callbackUrl: string) {
  const csrfRes = await fetch('/api/auth/csrf', { credentials: 'same-origin' })
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }

  const body = new URLSearchParams({ email, password, csrfToken, redirect: 'false', callbackUrl })

  const res = await fetch(`/api/auth/callback/${provider}`, {
    method: 'POST',
    // x-auth-return-redirect tells the NextAuth route handler to respond with
    // {url} JSON instead of issuing a real 302 — without it, fetch() silently
    // follows the redirect to an HTML page and every login looks like a failure.
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' },
    body: body.toString(),
    credentials: 'same-origin',
  })

  if (!res.ok) return { ok: false as const }

  const data = (await res.json().catch(() => null)) as { url?: string } | null
  const hasError = !data?.url || new URL(data.url).searchParams.has('error')

  return { ok: !hasError }
}
