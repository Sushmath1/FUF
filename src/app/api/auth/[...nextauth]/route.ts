import { NextRequest, NextResponse } from 'next/server'

import { handlers } from '@/lib/auth'

async function withJsonErrors(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest,
) {
  try {
    return await handler(req)
  } catch (error) {
    console.error('[Auth Route] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Authentication service error. Please try again.' },
      { status: 500 },
    )
  }
}

export const GET = (req: NextRequest) => withJsonErrors(handlers.GET, req)
export const POST = (req: NextRequest) => withJsonErrors(handlers.POST, req)