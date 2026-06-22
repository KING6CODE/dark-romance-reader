import { NextRequest, NextResponse } from 'next/server'
import { EMAIL_COOKIE } from '@/lib/access'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(EMAIL_COOKIE, email, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    path: '/',
  })

  return res
}
