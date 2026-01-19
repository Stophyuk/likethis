'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getActivityTimeline, TimelineItem } from '@/lib/activity-stats'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'

function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    x: 'X', threads: 'TH', producthunt: 'PH', medium: 'M', naver: 'N',
    youtube: 'YT', instagram: 'IG', reddit: 'R', linkedin: 'LI',
    indiehackers: 'IH', kakao: 'K',
  }
  return emojis[platform] || platform.charAt(0).toUpperCase()
}

export function ActivityTimeline() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [showDays, setShowDays] = useState(7)

  useEffect(() => {
    setTimeline(getActivityTimeline(showDays))
  }, [showDays])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">활동 타임라인</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-center text-gray-500 py-4">아직 기록된 활동이 없습니다</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, idx) => (
              <div key={idx}>
                <div className="text-sm font-medium text-gray-500 mb-2 border-b pb-1">
                  {item.dateStr}
                </div>
                <div className="space-y-1 pl-2">
                  {item.activities.map(({ platform, items }) => (
                    <div key={platform} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{getPlatformEmoji(platform)}</span>
                      <span className="text-gray-700">
                        {PLATFORM_GUIDES[platform as keyof typeof PLATFORM_GUIDES]?.name?.split(' ')[0] || platform}:
                      </span>
                      <span className="text-gray-500">{items.length}개 활동</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showDays < 90 && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setShowDays(prev => prev + 7)}
          >
            더 보기
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
