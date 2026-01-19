'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPlatformStats } from '@/lib/activity-stats'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import { AlertTriangle } from 'lucide-react'

function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    x: 'X', threads: 'TH', producthunt: 'PH', medium: 'M', naver: 'N',
    youtube: 'YT', instagram: 'IG', reddit: 'R', linkedin: 'LI',
    indiehackers: 'IH', kakao: 'K',
  }
  return emojis[platform] || platform.charAt(0).toUpperCase()
}

export function PlatformStats() {
  const [days, setDays] = useState(7)
  const [stats, setStats] = useState<{ platform: string; count: number }[]>([])

  useEffect(() => {
    setStats(getPlatformStats(days))
  }, [days])

  const maxCount = Math.max(...stats.map(s => s.count), 1)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">플랫폼별 활동</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={days === 7 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(7)}
            >
              7일
            </Button>
            <Button
              variant={days === 30 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(30)}
            >
              30일
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats.map(({ platform, count }) => {
          const percentage = (count / maxCount) * 100
          const isLow = count === 0
          return (
            <div key={platform} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs font-medium">{getPlatformEmoji(platform)}</span>
              <span className="w-20 text-sm truncate">
                {PLATFORM_GUIDES[platform as keyof typeof PLATFORM_GUIDES]?.name?.split(' ')[0] || platform}
              </span>
              <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${isLow ? 'bg-gray-300' : 'bg-green-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className={`w-8 text-right text-sm ${isLow ? 'text-amber-600' : ''}`}>
                {count}
              </span>
              {isLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
