'use client'

import { useState, useCallback } from 'react'
import { StreakCounter } from '@/components/dashboard/StreakCounter'
import { TodayChecklist } from '@/components/dashboard/TodayChecklist'
import { PlatformProgress } from '@/components/dashboard/PlatformProgress'
import { ActivityCalendar } from '@/components/dashboard/ActivityCalendar'
import { AttentionAlert } from '@/components/dashboard/AttentionAlert'

export default function DashboardPage() {
  // 체크리스트 변경 시 스트릭 카운터 갱신을 위한 트리거
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleActivityChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LikeThis</h1>
        <p className="text-gray-600 mt-2">
          커뮤니티 활동을 체계적으로 관리하세요
        </p>
      </div>

      <AttentionAlert />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StreakCounter refreshTrigger={refreshTrigger} />
        <ActivityCalendar />
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">오늘의 할 일</h2>
        <TodayChecklist onActivityChange={handleActivityChange} />
      </section>

      <section>
        <PlatformProgress />
      </section>
    </div>
  )
}
