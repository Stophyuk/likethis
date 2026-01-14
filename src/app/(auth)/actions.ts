'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth } from '@/lib/firebase/admin'

// 허용된 이메일 목록을 함수 호출 시마다 읽어오도록 변경
function getAllowedEmails(): string[] {
  const envValue = process.env.ALLOWED_EMAILS
  if (!envValue) return []
  return envValue.split(',').map(email => email.trim()).filter(Boolean)
}

export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days

  try {
    // 토큰을 먼저 검증하여 이메일 확인
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const email = decodedToken.email

    // 매 호출마다 환경변수 읽기
    const allowedEmails = getAllowedEmails()

    // 이메일 화이트리스트 검증 (환경변수가 비어있으면 모든 이메일 허용)
    if (allowedEmails.length > 0 && (!email || !allowedEmails.includes(email))) {
      console.log('Email rejected:', email, 'Allowed:', allowedEmails)
      return { error: '허용되지 않은 계정입니다' }
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    const cookieStore = await cookies()

    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    })

    return { success: true }
  } catch (error) {
    console.error('Session cookie error:', error)
    return { error: 'Failed to create session' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) return null

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true)
    return decodedClaims
  } catch (error) {
    return null
  }
}
