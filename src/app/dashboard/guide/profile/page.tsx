'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProfileForm } from '@/components/guide/ProfileForm'
import { PlatformProfileResult } from '@/components/guide/PlatformProfileResult'
import type { UserProfileInfo, Platform, PlatformProfileRecommendation } from '@/types'

export default function ProfileGuidePage() {
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<PlatformProfileRecommendation[]>([])

  const handleSubmit = async (userInfo: UserProfileInfo, platforms: Platform[]) => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInfo, platforms }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate profile')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Generate profile error:', error)
      alert('프로필 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/guide">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">맞춤형 프로필 가이드</h1>
          <p className="text-gray-600 mt-1">
            AI가 각 플랫폼에 최적화된 프로필 문구를 생성해드립니다
          </p>
        </div>
      </div>

      <ProfileForm onSubmit={handleSubmit} loading={loading} />

      {recommendations.length > 0 && (
        <PlatformProfileResult recommendations={recommendations} />
      )}
    </div>
  )
}
