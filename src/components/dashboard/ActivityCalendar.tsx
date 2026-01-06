'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ActivityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activityData, setActivityData] = useState<Record<number, number>>({})
  const [mounted, setMounted] = useState(false)

  // localStorage에서 월간 활동 데이터 로드
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const data: Record<number, number> = {}

    // 해당 월의 모든 날짜 체크
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `likethis_activities_${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const saved = localStorage.getItem(dateKey)
      if (saved) {
        try {
          const activities = JSON.parse(saved)
          const count = Object.values(activities).reduce((sum: number, arr) =>
            sum + (Array.isArray(arr) ? arr.length : 0), 0)
          data[day] = count as number
        } catch (e) {
          // ignore parse errors
        }
      }
    }
    setActivityData(data)
  }, [currentDate, mounted])

  const goToPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 캘린더 데이터 계산
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  // 활동 강도에 따른 색상
  const getActivityColor = (count: number) => {
    if (count === 0 || !count) return 'bg-gray-100'
    if (count <= 2) return 'bg-green-200'
    if (count <= 4) return 'bg-green-400'
    if (count <= 6) return 'bg-green-500'
    return 'bg-green-600'
  }

  // 셀 생성
  const cells = []

  // 빈 셀 (이전 달)
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  // 날짜 셀
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && today.getDate() === day
    const activityCount = activityData[day] || 0

    cells.push(
      <div
        key={day}
        className={`aspect-square rounded-sm flex items-center justify-center text-xs font-medium transition-colors relative ${
          getActivityColor(activityCount)
        } ${isToday ? 'ring-2 ring-gray-900 ring-offset-1' : ''}`}
        title={activityCount > 0 ? `${activityCount}개 활동` : '활동 없음'}
      >
        <span className={activityCount > 4 ? 'text-white' : 'text-gray-700'}>
          {day}
        </span>
      </div>
    )
  }

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">활동 캘린더</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-gray-400">
            로딩 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">활동 캘린더</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-sm font-medium hover:bg-gray-100 rounded"
          >
            {year}년 {month + 1}월
          </button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-1 ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {cells}
        </div>
        {/* 범례 */}
        <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-500">
          <span>적음</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-green-600" />
          <span>많음</span>
        </div>
      </CardContent>
    </Card>
  )
}
