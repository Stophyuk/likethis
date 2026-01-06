'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'

export default function SettingsPage() {
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({})
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 로컬 스토리지에서 설정 로드
    const savedPlatforms = localStorage.getItem('likethis_platforms')
    const savedInterests = localStorage.getItem('likethis_interests')

    if (savedPlatforms) {
      setPlatforms(JSON.parse(savedPlatforms))
    } else {
      // 기본값: 모든 플랫폼 활성화
      const defaults: Record<string, boolean> = {}
      Object.keys(PLATFORM_GUIDES).forEach(p => defaults[p] = true)
      setPlatforms(defaults)
    }

    if (savedInterests) {
      setInterests(JSON.parse(savedInterests))
    }
  }, [])

  const togglePlatform = (platform: string) => {
    const updated = { ...platforms, [platform]: !platforms[platform] }
    setPlatforms(updated)
    localStorage.setItem('likethis_platforms', JSON.stringify(updated))
  }

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const updated = [...interests, newInterest.trim()]
      setInterests(updated)
      localStorage.setItem('likethis_interests', JSON.stringify(updated))
      setNewInterest('')
    }
  }

  const removeInterest = (interest: string) => {
    const updated = interests.filter(i => i !== interest)
    setInterests(updated)
    localStorage.setItem('likethis_interests', JSON.stringify(updated))
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="text-gray-600 mt-2">활동할 플랫폼과 관심사를 설정하세요</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-gray-600 mt-2">활동할 플랫폼과 관심사를 설정하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>관심사</CardTitle>
          <CardDescription>AI 추천에 활용됩니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="관심사 입력 (예: 1인개발, AI, 사이드프로젝트)"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInterest()}
            />
            <Button onClick={addInterest}>추가</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.length === 0 ? (
              <p className="text-sm text-gray-500">관심사를 추가해주세요</p>
            ) : (
              interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="cursor-pointer hover:bg-gray-200" onClick={() => removeInterest(interest)}>
                  {interest} ×
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>플랫폼 설정</CardTitle>
          <CardDescription>활동할 플랫폼을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.values(PLATFORM_GUIDES).map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformEmoji(platform.platform)}</span>
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                  </div>
                </div>
                <Switch
                  checked={platforms[platform.platform] ?? true}
                  onCheckedChange={() => togglePlatform(platform.platform)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    x: '𝕏',
    producthunt: '🚀',
    medium: '📝',
    naver: '🟢',
    youtube: '▶️',
    instagram: '📸',
    reddit: '🤖',
    linkedin: '💼',
    indiehackers: '🛠️',
    kakao: '💬',
  }
  return emojis[platform] || '📱'
}
