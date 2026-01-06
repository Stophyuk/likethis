'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { createSessionCookie } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      await createSessionCookie(idToken)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>새 계정을 만드세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
