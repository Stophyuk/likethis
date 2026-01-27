'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { getJourneyStatsRange } from '@/lib/firebase/firestore'
import Link from 'next/link'

interface CentaurScoreProps {
  refreshTrigger?: number
}

export function CentaurScore({ refreshTrigger }: CentaurScoreProps) {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    pureMinutes: 0,
    aiAssistedMinutes: 0,
    totalSessions: 0,
    failLogs: 0,
    reflections: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Get last 7 days stats
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        const dayStats = await getJourneyStatsRange(user.uid, startDate, endDate)

        const totals = dayStats.reduce(
          (acc, day) => ({
            pureMinutes: acc.pureMinutes + day.totalPureMinutes,
            aiAssistedMinutes: acc.aiAssistedMinutes + day.totalAiAssistedMinutes,
            totalSessions: acc.totalSessions + day.sessionCount,
            failLogs: acc.failLogs + day.failLogCount,
            reflections: acc.reflections + (day.hasReflection ? 1 : 0),
          }),
          { pureMinutes: 0, aiAssistedMinutes: 0, totalSessions: 0, failLogs: 0, reflections: 0 }
        )

        setStats(totals)
      } catch (error) {
        console.error('Failed to load centaur stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user, refreshTrigger])

  // Calculate centaur score (0-100)
  const totalMinutes = stats.pureMinutes + stats.aiAssistedMinutes
  const pureRatio = totalMinutes > 0 ? stats.pureMinutes / totalMinutes : 0.5
  // Ideal is 50-70% pure thinking, score peaks at 60%
  const centaurScore = Math.round(100 - Math.abs(pureRatio - 0.6) * 200)
  const clampedScore = Math.max(0, Math.min(100, centaurScore))

  // Determine status message
  const getStatusMessage = () => {
    if (totalMinutes === 0) return '아직 기록이 없어요'
    if (pureRatio < 0.3) return 'AI 의존도가 높아요'
    if (pureRatio < 0.5) return 'AI와 균형 잡힌 협업'
    if (pureRatio < 0.7) return '이상적인 Centaur!'
    if (pureRatio < 0.9) return '독립적 사고 우세'
    return 'AI 활용을 더 해보세요'
  }

  // Get score color
  const getScoreColor = () => {
    if (clampedScore >= 80) return 'text-green-600'
    if (clampedScore >= 60) return 'text-blue-600'
    if (clampedScore >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Centaur Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-24 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Centaur Score</span>
          <Link
            href="/dashboard/journey"
            className="text-sm font-normal text-gray-500 hover:text-gray-700"
          >
            자세히 →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className={`text-4xl font-bold ${getScoreColor()}`}>{clampedScore}</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700">{getStatusMessage()}</div>
            <div className="text-xs text-gray-500">지난 7일 기준</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>순수 사고 {Math.round(pureRatio * 100)}%</span>
            <span>AI 보조 {Math.round((1 - pureRatio) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${pureRatio * 100}%` }}
            />
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${(1 - pureRatio) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.totalSessions}</div>
            <div className="text-xs text-gray-500">세션</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.failLogs}</div>
            <div className="text-xs text-gray-500">실패 기록</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{stats.reflections}</div>
            <div className="text-xs text-gray-500">성찰</div>
          </div>
        </div>

        {/* Ideal Zone Indicator */}
        {totalMinutes > 0 && (
          <div className="text-xs text-center text-gray-400 pt-1">
            이상적인 비율: 순수 사고 50-70%
          </div>
        )}
      </CardContent>
    </Card>
  )
}
