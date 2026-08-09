import { NextResponse } from 'next/server'

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status })
export const err = (msg: string, status: number) => NextResponse.json({ error: msg }, { status })
export const serverErr = (e: unknown) => {
  console.error('[Server Error]', e)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}