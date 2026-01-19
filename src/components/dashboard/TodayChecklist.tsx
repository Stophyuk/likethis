'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { platformGuides, PLATFORM_GUIDES } from '@/lib/platform-guides'
import { Platform, ActivityGoal } from '@/types'

// 오늘 날짜 키 생성
function getTodayKey(): string {
  const today = new Date()
  return `likethis_activities_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

// 활성화된 플랫폼 가져오기
function getActivePlatforms(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  const saved = localStorage.getItem('likethis_platforms')
  if (saved) {
    return JSON.parse(saved)
  }
  // 기본값: 모든 플랫폼 활성화
  const defaults: Record<string, boolean> = {}
  Object.keys(PLATFORM_GUIDES).forEach(p => defaults[p] = true)
  return defaults
}

interface TodayChecklistProps {
  onActivityChange?: () => void
}

export function TodayChecklist({ onActivityChange }: TodayChecklistProps) {
  const [activePlatforms, setActivePlatforms] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setActivePlatforms(getActivePlatforms())
  }, [])

  // 일일 목표가 있고 활성화된 플랫폼만 필터
  const dailyPlatforms = Object.values(platformGuides).filter(
    p => p.defaultDailyGoals.length > 0 && activePlatforms[p.platform] !== false
  )

  if (dailyPlatforms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          일일 목표가 있는 활성화된 플랫폼이 없습니다.
          <br />설정에서 플랫폼을 활성화해주세요.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dailyPlatforms.map((platform) => (
        <PlatformCheckCard
          key={platform.platform}
          platform={platform}
          onActivityChange={onActivityChange}
        />
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
  onActivityChange?: () => void
}

function PlatformCheckCard({ platform, onActivityChange }: PlatformCheckCardProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  // 로컬 스토리지에서 오늘의 체크 상태 로드
  useEffect(() => {
    const todayKey = getTodayKey()
    const saved = localStorage.getItem(todayKey)
    if (saved) {
      const data = JSON.parse(saved)
      if (data[platform.platform]) {
        setCheckedItems(new Set(data[platform.platform]))
      }
    }
  }, [platform.platform])

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

    // 로컬 스토리지에 저장
    const todayKey = getTodayKey()
    const saved = localStorage.getItem(todayKey)
    const data = saved ? JSON.parse(saved) : {}
    data[platform.platform] = Array.from(newChecked)
    localStorage.setItem(todayKey, JSON.stringify(data))

    // 스트릭 업데이트 트리거
    if (onActivityChange) {
      onActivityChange()
    }
  }

  const currentCompleted = checkedItems.size

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
    threads: '🧵',
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
