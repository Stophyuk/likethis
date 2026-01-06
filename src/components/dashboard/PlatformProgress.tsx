'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { platformGuides, PLATFORM_GUIDES } from '@/lib/platform-guides'
import { Platform, GoalFrequency } from '@/types'

// 활성화된 플랫폼 가져오기
function getActivePlatforms(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  const saved = localStorage.getItem('likethis_platforms')
  if (saved) {
    return JSON.parse(saved)
  }
  const defaults: Record<string, boolean> = {}
  Object.keys(PLATFORM_GUIDES).forEach(p => defaults[p] = true)
  return defaults
}

// 오늘 날짜 키
function getTodayKey(): string {
  const today = new Date()
  return `likethis_activities_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

// 주간 날짜 키들 (이번 주 일요일부터)
function getWeekKeys(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - dayOfWeek)

  const keys: string[] = []
  for (let i = 0; i <= dayOfWeek; i++) {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)
    keys.push(`likethis_activities_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
  }
  return keys
}

// 월간 날짜 키들 (이번 달 1일부터)
function getMonthKeys(): string[] {
  const today = new Date()
  const keys: string[] = []
  for (let i = 1; i <= today.getDate(); i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), i)
    keys.push(`likethis_activities_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)
  }
  return keys
}

// 플랫폼별 완료 개수 가져오기
function getCompletedCount(platform: string, frequency: GoalFrequency): number {
  if (typeof window === 'undefined') return 0

  let keys: string[] = []
  switch (frequency) {
    case 'daily':
      keys = [getTodayKey()]
      break
    case 'weekly':
      keys = getWeekKeys()
      break
    case 'monthly':
      keys = getMonthKeys()
      break
  }

  let total = 0
  for (const key of keys) {
    const saved = localStorage.getItem(key)
    if (saved) {
      const data = JSON.parse(saved)
      if (data[platform] && Array.isArray(data[platform])) {
        total += data[platform].length
      }
    }
  }
  return total
}

export function PlatformProgress() {
  const [frequency, setFrequency] = useState<GoalFrequency>('daily')
  const [activePlatforms, setActivePlatforms] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setActivePlatforms(getActivePlatforms())
  }, [])

  const getGoalsForFrequency = (platform: typeof platformGuides.x, freq: GoalFrequency) => {
    switch (freq) {
      case 'daily':
        return platform.defaultDailyGoals
      case 'weekly':
        return platform.defaultWeeklyGoals
      case 'monthly':
        return platform.defaultMonthlyGoals
      default:
        return platform.defaultDailyGoals
    }
  }

  const platforms = Object.values(platformGuides).filter(p => {
    const goals = getGoalsForFrequency(p, frequency)
    return goals.length > 0 && activePlatforms[p.platform] !== false
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>플랫폼별 진행률</span>
          <Tabs value={frequency} onValueChange={(v) => setFrequency(v as GoalFrequency)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-2">일간</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2">주간</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2">월간</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform) => {
            const goals = getGoalsForFrequency(platform, frequency)
            const totalGoals = goals.reduce((sum, g) => sum + g.count, 0)
            const completed = mounted ? getCompletedCount(platform.platform, frequency) : 0
            const percentage = totalGoals > 0 ? Math.min((completed / totalGoals) * 100, 100) : 0

            return (
              <div key={platform.platform} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getPlatformEmoji(platform.platform)}</span>
                    <span>{platform.name}</span>
                  </div>
                  <span className="text-gray-500">
                    {completed}/{totalGoals} ({Math.round(percentage)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
          {platforms.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              {frequency === 'daily' && '일간 목표가 설정된 플랫폼이 없습니다'}
              {frequency === 'weekly' && '주간 목표가 설정된 플랫폼이 없습니다'}
              {frequency === 'monthly' && '월간 목표가 설정된 플랫폼이 없습니다'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getPlatformEmoji(platform: Platform): string {
  const emojis: Record<Platform, string> = {
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
