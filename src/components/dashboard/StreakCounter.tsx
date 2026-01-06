'use client'

import { Card, CardContent } from '@/components/ui/card'

interface StreakCounterProps {
  streak?: number
  lastWeek?: boolean[]
}

export function StreakCounter({ streak = 0, lastWeek = [] }: StreakCounterProps) {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const today = new Date().getDay()

  // 최근 7일 배열 (기본값)
  const weekData = lastWeek.length === 7 ? lastWeek : Array(7).fill(false)

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
            {weekData.map((active, idx) => (
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
