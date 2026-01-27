'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThinkingTimer, FailFastForm, DailyReflectionCard } from '@/components/journey'
import { useAuth } from '@/hooks/useAuth'
import {
  saveDeepWorkSession,
  getDeepWorkSessions,
  saveFailFastLog,
  getFailFastLogs,
  saveDailyReflection,
  getDailyReflection,
  getJourneyDayStats,
} from '@/lib/firebase/firestore'
import type { DeepWorkSession, FailFastLog, DailyReflection, JourneyDayStats } from '@/types'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export default function JourneyPage() {
  const { user, loading: authLoading } = useAuth()
  const [todayStats, setTodayStats] = useState<JourneyDayStats>({
    date: getToday(),
    totalPureMinutes: 0,
    totalAiAssistedMinutes: 0,
    sessionCount: 0,
    failLogCount: 0,
    hasReflection: false,
  })
  const [sessions, setSessions] = useState<DeepWorkSession[]>([])
  const [failLogs, setFailLogs] = useState<FailFastLog[]>([])
  const [reflection, setReflection] = useState<DailyReflection | null>(null)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load data on mount
  const loadData = useCallback(async () => {
    if (!user) return

    try {
      const today = getToday()
      const [todaySessions, logs, todayReflection, stats] = await Promise.all([
        getDeepWorkSessions(user.uid, today),
        getFailFastLogs(user.uid, 10),
        getDailyReflection(user.uid, today),
        getJourneyDayStats(user.uid, today),
      ])

      setSessions(todaySessions)
      setFailLogs(logs)
      setReflection(todayReflection)
      setTodayStats(stats)
    } catch (error) {
      console.error('Failed to load journey data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
    } else if (!authLoading && !user) {
      setIsLoading(false)
    }
  }, [authLoading, user, loadData])

  // Handle session complete
  const handleSessionComplete = async (session: DeepWorkSession) => {
    if (!user) return

    try {
      await saveDeepWorkSession(user.uid, session)
      setSessions(prev => [session, ...prev])

      // Update stats
      const minutes = Math.round((session.duration || 0) / 60)
      setTodayStats(prev => ({
        ...prev,
        sessionCount: prev.sessionCount + 1,
        totalPureMinutes: session.mode === 'pure' ? prev.totalPureMinutes + minutes : prev.totalPureMinutes,
        totalAiAssistedMinutes: session.mode === 'ai-assisted' ? prev.totalAiAssistedMinutes + minutes : prev.totalAiAssistedMinutes,
      }))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  // Handle fail log submit
  const handleFailLogSubmit = async (log: FailFastLog) => {
    if (!user) return

    try {
      await saveFailFastLog(user.uid, log)
      setFailLogs(prev => [log, ...prev])
      setTodayStats(prev => ({
        ...prev,
        failLogCount: prev.failLogCount + 1,
      }))
    } catch (error) {
      console.error('Failed to save fail log:', error)
    }
  }

  // Generate reflection questions
  const handleGenerateQuestions = async (): Promise<string[]> => {
    setIsGeneratingQuestions(true)

    try {
      const response = await fetch('/api/generate-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todayStats,
          recentSessions: sessions.slice(0, 5).map(s => ({
            category: s.category,
            mode: s.mode,
            duration: s.duration || 0,
            notes: s.notes,
          })),
          recentFails: failLogs
            .filter(l => l.createdAt.startsWith(getToday()))
            .slice(0, 3)
            .map(l => ({
              whatTried: l.whatTried,
              whatFailed: l.whatFailed,
              whatLearned: l.whatLearned,
            })),
        }),
      })

      const data = await response.json()
      return data.questions || []
    } catch (error) {
      console.error('Failed to generate questions:', error)
      return [
        '오늘 가장 집중했던 순간은 언제였나요?',
        '이번 주에 가장 큰 배움은 무엇이었나요?',
        '내일 꼭 해야 할 한 가지는 무엇인가요?',
      ]
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  // Save reflection
  const handleSaveReflection = async (newReflection: DailyReflection) => {
    if (!user) return

    try {
      await saveDailyReflection(user.uid, newReflection)
      setReflection(newReflection)
      setTodayStats(prev => ({ ...prev, hasReflection: true }))
    } catch (error) {
      console.error('Failed to save reflection:', error)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">로그인이 필요합니다</p>
      </div>
    )
  }

  // Calculate Centaur Score
  const totalMinutes = todayStats.totalPureMinutes + todayStats.totalAiAssistedMinutes
  const centaurScore = totalMinutes > 0
    ? Math.round((todayStats.totalPureMinutes / totalMinutes) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Journey</h1>
        <p className="text-gray-600">Deep Work를 추적하고, 실패를 기록하고, 매일 성찰합니다</p>
      </div>

      {/* Centaur Score Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-amber-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">오늘의 Centaur Score</h2>
            <p className="text-sm text-gray-600">AI 능력 + 인간 의지의 균형</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-purple-600">{centaurScore}%</div>
            <div className="text-sm text-gray-500">자립 사고 비율</div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${centaurScore}%` }}
            />
            <div
              className="bg-gray-300 transition-all duration-500"
              style={{ width: `${100 - centaurScore}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Pure Mode: {todayStats.totalPureMinutes}분</span>
          <span>AI Assisted: {todayStats.totalAiAssistedMinutes}분</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer */}
        <ThinkingTimer onSessionComplete={handleSessionComplete} />

        {/* Daily Reflection */}
        <DailyReflectionCard
          date={getToday()}
          stats={todayStats}
          reflection={reflection}
          onGenerateQuestions={handleGenerateQuestions}
          onSaveReflection={handleSaveReflection}
          isGenerating={isGeneratingQuestions}
        />
      </div>

      {/* Fail-Fast Log */}
      <FailFastForm onSubmit={handleFailLogSubmit} recentLogs={failLogs} />

      {/* Philosophy Quote */}
      <div className="text-center py-8 text-gray-500 text-sm">
        <p>&ldquo;AI가 할 수 있는 건 AI에게 맡기고,</p>
        <p>나만이 할 수 있는 일에 집중하라.&rdquo;</p>
        <p className="mt-2 text-xs">— Centaur Model</p>
      </div>
    </div>
  )
}
