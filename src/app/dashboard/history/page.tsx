'use client'

import { WeeklyReport } from '@/components/history/WeeklyReport'
import { PlatformStats } from '@/components/history/PlatformStats'
import { ActivityTimeline } from '@/components/history/ActivityTimeline'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">히스토리</h1>
        <p className="text-gray-600 mt-1">활동 기록과 통계를 확인하세요</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <WeeklyReport />
        <PlatformStats />
      </div>

      <ActivityTimeline />
    </div>
  )
}
