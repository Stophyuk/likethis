import { StreakCounter } from '@/components/dashboard/StreakCounter'
import { TodayChecklist } from '@/components/dashboard/TodayChecklist'
import { PlatformProgress } from '@/components/dashboard/PlatformProgress'

export default function DashboardPage() {
  // TODO: 실제 데이터는 Supabase에서 가져올 예정
  const mockLogs: any[] = []
  const mockStreak = 0
  const mockWeek = [false, false, false, false, false, false, false]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LikeThis</h1>
        <p className="text-gray-600 mt-2">
          커뮤니티 활동을 체계적으로 관리하세요
        </p>
      </div>

      <StreakCounter streak={mockStreak} lastWeek={mockWeek} />

      <section>
        <h2 className="text-xl font-bold mb-4">오늘의 할 일</h2>
        <TodayChecklist logs={mockLogs} />
      </section>

      <section>
        <PlatformProgress logs={mockLogs} />
      </section>
    </div>
  )
}
