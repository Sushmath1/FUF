import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token') ??
    request.cookies.get('next-auth.session-token') ??
    request.cookies.get('__Secure-next-auth.session-token')

  const collegeRoutes = ['/college/dashboard', '/college/events', '/college/map-setup']
  if (collegeRoutes.some((route) => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL('/college/login', request.url))
  }

  if (pathname === '/visitor/history' && !token) {
    return NextResponse.redirect(new URL('/visitor/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/college/dashboard/:path*', '/college/events/:path*', '/college/map-setup/:path*', '/visitor/history'],
}