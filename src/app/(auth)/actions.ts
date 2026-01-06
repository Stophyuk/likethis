'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminAuth } from '@/lib/firebase/admin'

export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days

  try {
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
