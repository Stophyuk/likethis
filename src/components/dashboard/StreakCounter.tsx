'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'

// 날짜 키 생성 (YYYY-MM-DD)
function getDateKey(date: Date): string {
  return `likethis_activities_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 해당 날짜에 활동이 있는지 확인
function hasActivityOnDate(date: Date): boolean {
  if (typeof window === 'undefined') return false
  const key = getDateKey(date)
  const saved = localStorage.getItem(key)
  if (!saved) return false

  const data = JSON.parse(saved)
  // 어떤 플랫폼이든 하나라도 체크가 있으면 활동으로 간주
  return Object.values(data).some((activities: any) =>
    Array.isArray(activities) && activities.length > 0
  )
}

// 연속 활동 일수 계산
function calculateStreak(): number {
  if (typeof window === 'undefined') return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 오늘부터 과거로 거슬러 올라가며 체크
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)

    if (hasActivityOnDate(checkDate)) {
      streak++
    } else if (i === 0) {
      // 오늘 활동이 없어도 어제까지 연속이면 스트릭 유지
      continue
    } else {
      break
    }
  }

  return streak
}

// 최근 7일 활동 여부
function getLastWeekActivity(): boolean[] {
  if (typeof window === 'undefined') return Array(7).fill(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay() // 0=일, 1=월, ...

  const result: boolean[] = []

  // 일요일부터 토요일까지 순서대로
  for (let i = 0; i < 7; i++) {
    const diff = i - dayOfWeek
    const date = new Date(today)
    date.setDate(today.getDate() + diff)
    result.push(hasActivityOnDate(date))
  }

  return result
}

interface StreakCounterProps {
  refreshTrigger?: number
}

export function StreakCounter({ refreshTrigger }: StreakCounterProps) {
  const [streak, setStreak] = useState(0)
  const [lastWeek, setLastWeek] = useState<boolean[]>(Array(7).fill(false))
  const [mounted, setMounted] = useState(false)

  const days = ['일', '월', '화', '수', '목', '금', '토']
  const today = new Date().getDay()

  const updateData = useCallback(() => {
    setStreak(calculateStreak())
    setLastWeek(getLastWeekActivity())
  }, [])

  useEffect(() => {
    setMounted(true)
    updateData()
  }, [updateData])

  // refreshTrigger가 변경될 때마다 데이터 갱신
  useEffect(() => {
    if (mounted && refreshTrigger !== undefined) {
      updateData()
    }
  }, [refreshTrigger, mounted, updateData])

  if (!mounted) {
    return (
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold flex items-center gap-2">
                🔥 0일
              </div>
              <p className="text-orange-100 mt-1">연속 활동 스트릭</p>
            </div>
            <div className="flex gap-1">
              {Array(7).fill(false).map((_, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded flex items-center justify-center text-xs bg-white/10"
                >
                  {days[idx]}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold flex items-center gap-2">
              🔥 {streak}일
            </div>
            <p className="text-orange-100 mt-1">연속 활동 스트릭</p>
          </div>
          <div className="flex gap-1">
            {lastWeek.map((active, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                  active ? 'bg-white/30' : 'bg-white/10'
                } ${idx === today ? 'ring-2 ring-white' : ''}`}
              >
                {days[idx]}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
