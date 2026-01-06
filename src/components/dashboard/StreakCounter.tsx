'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame } from 'lucide-react'

// 기존 함수들 유지 (getDateKey, hasActivityOnDate, calculateStreak, getLastWeekActivity)

function getDateKey(date: Date): string {
  return `likethis_activities_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function hasActivityOnDate(date: Date): boolean {
  if (typeof window === 'undefined') return false
  const key = getDateKey(date)
  const saved = localStorage.getItem(key)
  if (!saved) return false
  const data = JSON.parse(saved)
  return Object.values(data).some((activities: any) =>
    Array.isArray(activities) && activities.length > 0
  )
}

function calculateStreak(): number {
  if (typeof window === 'undefined') return 0
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    if (hasActivityOnDate(checkDate)) {
      streak++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }
  return streak
}

function getLastWeekActivity(): boolean[] {
  if (typeof window === 'undefined') return Array(7).fill(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  const result: boolean[] = []
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

  useEffect(() => {
    if (mounted && refreshTrigger !== undefined) {
      updateData()
    }
  }, [refreshTrigger, mounted, updateData])

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">연속 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">연속 활동</CardTitle>
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="w-5 h-5" />
            <span className="text-2xl font-bold">{streak}</span>
            <span className="text-sm text-gray-500">일</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 이번 주 활동 표시 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const active = lastWeek[idx]
            const isToday = idx === today
            return (
              <div key={idx} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{day}</div>
                <div
                  className={`w-full aspect-square rounded-sm flex items-center justify-center ${
                    active ? 'bg-orange-400' : 'bg-gray-100'
                  } ${isToday ? 'ring-2 ring-orange-500' : ''}`}
                >
                  {active && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* 동기부여 메시지 */}
        <p className="text-xs text-gray-500 text-center mt-3">
          {streak === 0 && '오늘 첫 활동을 시작해보세요!'}
          {streak > 0 && streak < 7 && `${7 - streak}일 더 하면 1주일 달성!`}
          {streak >= 7 && streak < 30 && '잘 하고 있어요! 한 달 목표를 향해!'}
          {streak >= 30 && '대단해요! 꾸준함이 빛나고 있어요 ✨'}
        </p>
      </CardContent>
    </Card>
  )
}
