'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useJourneyTimer } from '@/hooks/useJourneyTimer'
import type { DeepWorkCategory, DeepWorkMode, DeepWorkSession } from '@/types'

interface ThinkingTimerProps {
  onSessionComplete?: (session: DeepWorkSession) => void
}

const categoryLabels: Record<DeepWorkCategory, { label: string; emoji: string; color: string }> = {
  thinking: { label: '사고', emoji: '🧠', color: 'bg-purple-500' },
  creating: { label: '창작', emoji: '✨', color: 'bg-blue-500' },
  reflecting: { label: '성찰', emoji: '🪞', color: 'bg-green-500' },
}

const modeLabels: Record<DeepWorkMode, { label: string; description: string }> = {
  pure: { label: 'Pure Mode', description: 'AI 도움 없이 스스로 생각하는 시간' },
  'ai-assisted': { label: 'AI Assisted', description: 'AI와 함께 작업하는 시간' },
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function ThinkingTimer({ onSessionComplete }: ThinkingTimerProps) {
  const [selectedCategory, setSelectedCategory] = useState<DeepWorkCategory>('thinking')
  const [selectedMode, setSelectedMode] = useState<DeepWorkMode>('pure')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const timer = useJourneyTimer({
    onSessionComplete: (session) => {
      onSessionComplete?.(session)
      setNotes('')
      setShowNotes(false)
    },
  })

  const stats = timer.getTodayStats()
  const centaurRatio = stats.total > 0
    ? Math.round((stats.pure / stats.total) * 100)
    : 0

  const handleStart = () => {
    timer.start(selectedCategory, selectedMode)
  }

  const handleStop = () => {
    setShowNotes(true)
  }

  const handleConfirmStop = () => {
    timer.stop(notes || undefined)
  }

  const handleCancelStop = () => {
    setShowNotes(false)
    setNotes('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Deep Work Timer</span>
          {timer.isRunning && (
            <span className="inline-flex items-center gap-1 text-sm font-normal text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              진행 중
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold tabular-nums">
            {formatTime(timer.elapsedSeconds)}
          </div>
          {timer.isRunning && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`px-2 py-1 rounded text-white text-sm ${categoryLabels[timer.category].color}`}>
                {categoryLabels[timer.category].emoji} {categoryLabels[timer.category].label}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${timer.mode === 'pure' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                {modeLabels[timer.mode].label}
              </span>
            </div>
          )}
        </div>

        {/* Settings (when not running) */}
        {!timer.isRunning && (
          <>
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(categoryLabels) as DeepWorkCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedCategory === cat
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl">{categoryLabels[cat].emoji}</div>
                    <div className="text-sm font-medium">{categoryLabels[cat].label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모드</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(modeLabels) as DeepWorkMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMode(m)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedMode === m
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{modeLabels[m].label}</div>
                    <div className="text-sm text-gray-500">{modeLabels[m].description}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Notes Input (when stopping) */}
        {showNotes && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700">
              세션 메모 (선택)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="이 시간 동안 무엇을 했나요?"
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleConfirmStop} className="flex-1">
                세션 완료
              </Button>
              <Button variant="outline" onClick={handleCancelStop}>
                취소
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        {!showNotes && (
          <div className="flex gap-2">
            {!timer.isRunning ? (
              <Button onClick={handleStart} className="flex-1" size="lg">
                시작하기
              </Button>
            ) : (
              <>
                {timer.isPaused ? (
                  <Button onClick={timer.resume} className="flex-1" variant="outline">
                    재개
                  </Button>
                ) : (
                  <Button onClick={timer.pause} className="flex-1" variant="outline">
                    일시정지
                  </Button>
                )}
                <Button onClick={handleStop} variant="destructive">
                  종료
                </Button>
              </>
            )}
          </div>
        )}

        {/* Today's Stats */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">오늘의 기록</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-amber-600">{stats.pure}</div>
              <div className="text-xs text-gray-500">Pure 분</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{stats.aiAssisted}</div>
              <div className="text-xs text-gray-500">AI Assisted 분</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{centaurRatio}%</div>
              <div className="text-xs text-gray-500">자립도</div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        {timer.todaySessions.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">최근 세션</h4>
            <div className="space-y-2">
              {timer.todaySessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{categoryLabels[session.category].emoji}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      session.mode === 'pure' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {session.mode === 'pure' ? 'Pure' : 'AI'}
                    </span>
                    {session.notes && (
                      <span className="text-gray-500 truncate max-w-[150px]">{session.notes}</span>
                    )}
                  </div>
                  <span className="font-mono text-gray-600">
                    {formatTime(session.duration || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
