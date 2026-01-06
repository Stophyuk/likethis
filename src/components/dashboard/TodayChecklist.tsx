'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { platformGuides } from '@/lib/platform-guides'
import { Platform, ActivityGoal, ActivityLog } from '@/types'

interface TodayChecklistProps {
  logs?: ActivityLog[]
}

export function TodayChecklist({ logs = [] }: TodayChecklistProps) {
  // 일일 목표가 있는 플랫폼만 필터
  const dailyPlatforms = Object.values(platformGuides).filter(
    p => p.defaultDailyGoals.length > 0
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dailyPlatforms.map((platform) => (
        <PlatformCheckCard key={platform.platform} platform={platform} logs={logs} />
      ))}
    </div>
  )
}

interface PlatformCheckCardProps {
  platform: {
    platform: Platform
    name: string
    icon: string
    defaultDailyGoals: ActivityGoal[]
  }
  logs: ActivityLog[]
}

function PlatformCheckCard({ platform, logs }: PlatformCheckCardProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  // 해당 플랫폼의 오늘 완료된 활동 수
  const completedCount = logs.filter(l => l.platform === platform.platform).length
  const totalGoals = platform.defaultDailyGoals.reduce((sum: number, g: ActivityGoal) => sum + g.count, 0)

  const handleCheck = (goalIdx: number, checked: boolean) => {
    const key = `${platform.platform}-${goalIdx}`
    const newChecked = new Set(checkedItems)
    if (checked) {
      newChecked.add(key)
    } else {
      newChecked.delete(key)
    }
    setCheckedItems(newChecked)
    // TODO: 실제로는 여기서 Supabase에 활동 기록 저장
  }

  const currentCompleted = completedCount + checkedItems.size

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-xl">{getPlatformEmoji(platform.platform)}</span>
          <span>{platform.name}</span>
          <span className="ml-auto text-sm font-normal text-gray-500">
            {currentCompleted}/{totalGoals}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {platform.defaultDailyGoals.map((goal: ActivityGoal, idx: number) => {
            const isChecked = checkedItems.has(`${platform.platform}-${idx}`)
            return (
              <div key={idx} className="flex items-center gap-2">
                <Checkbox
                  id={`${platform.platform}-${idx}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCheck(idx, checked as boolean)}
                />
                <label
                  htmlFor={`${platform.platform}-${idx}`}
                  className={`text-sm cursor-pointer ${isChecked ? 'line-through text-gray-400' : ''}`}
                >
                  {goal.description || `${goal.type} ${goal.count}개`}
                </label>
              </div>
            )
          })}
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
