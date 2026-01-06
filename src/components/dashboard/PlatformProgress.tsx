'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { platformGuides } from '@/lib/platform-guides'
import { Platform, ActivityLog, GoalFrequency } from '@/types'

interface PlatformProgressProps {
  logs?: ActivityLog[]
}

export function PlatformProgress({ logs = [] }: PlatformProgressProps) {
  const [frequency, setFrequency] = useState<GoalFrequency>('daily')

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
    return goals.length > 0
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
            const completed = logs.filter(l => l.platform === platform.platform).length
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
