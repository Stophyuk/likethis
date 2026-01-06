'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWeeklyComparison, getActiveDays, getPlatformStats, getInactivePlatforms } from '@/lib/activity-stats'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import { TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle } from 'lucide-react'

export function WeeklyReport() {
  const [data, setData] = useState<{
    thisWeek: number
    lastWeek: number
    diff: number
    activeDays: number
    topPlatform: string | null
    inactivePlatforms: string[]
  } | null>(null)

  useEffect(() => {
    const comparison = getWeeklyComparison()
    const stats = getPlatformStats(7)
    const inactive = getInactivePlatforms(7)

    setData({
      ...comparison,
      activeDays: getActiveDays(7),
      topPlatform: stats[0]?.count > 0 ? stats[0].platform : null,
      inactivePlatforms: inactive
    })
  }, [])

  if (!data) return null

  const DiffIcon = data.diff > 0 ? TrendingUp : data.diff < 0 ? TrendingDown : Minus
  const diffColor = data.diff > 0 ? 'text-green-600' : data.diff < 0 ? 'text-red-600' : 'text-gray-500'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          이번 주 리포트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">총 활동</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{data.thisWeek}개</span>
            <span className={`flex items-center text-sm ${diffColor}`}>
              <DiffIcon className="w-4 h-4" />
              {data.diff > 0 ? '+' : ''}{data.diff}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">활동 일수</span>
          <span className="font-medium">{data.activeDays}일 / 7일</span>
        </div>

        {data.topPlatform && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              최다 활동
            </span>
            <span className="font-medium">
              {PLATFORM_GUIDES[data.topPlatform as keyof typeof PLATFORM_GUIDES]?.name || data.topPlatform}
            </span>
          </div>
        )}

        {data.inactivePlatforms.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>신경 쓸 플랫폼:</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {data.inactivePlatforms.map(p =>
                PLATFORM_GUIDES[p as keyof typeof PLATFORM_GUIDES]?.name || p
              ).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
