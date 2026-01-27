'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ThinkFirstTimerProps {
  ideaId: string
  promptsCompleted: number
  onUnlock: () => void
  onTimeUpdate: (seconds: number) => void
  initialSeconds?: number
}

const REQUIRED_SECONDS = 5 * 60  // 5 minutes
const REQUIRED_PROMPTS = 3       // 3 prompts for early unlock

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ThinkFirstTimer({
  ideaId,
  promptsCompleted,
  onUnlock,
  onTimeUpdate,
  initialSeconds = 0,
}: ThinkFirstTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startedAtRef = useRef<number | null>(null)

  // Check unlock conditions
  const checkUnlock = useCallback(() => {
    const timeUnlock = elapsedSeconds >= REQUIRED_SECONDS
    const promptUnlock = promptsCompleted >= REQUIRED_PROMPTS

    if ((timeUnlock || promptUnlock) && !isUnlocked) {
      setIsUnlocked(true)
      onUnlock()
    }
  }, [elapsedSeconds, promptsCompleted, isUnlocked, onUnlock])

  useEffect(() => {
    checkUnlock()
  }, [checkUnlock])

  // Timer logic
  useEffect(() => {
    if (isRunning && !isUnlocked) {
      startedAtRef.current = Date.now() - elapsedSeconds * 1000
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const newElapsed = Math.floor((now - (startedAtRef.current || now)) / 1000)
        setElapsedSeconds(newElapsed)
        onTimeUpdate(newElapsed)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isUnlocked, elapsedSeconds, onTimeUpdate])

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const progressPercent = Math.min((elapsedSeconds / REQUIRED_SECONDS) * 100, 100)
  const promptProgress = Math.min((promptsCompleted / REQUIRED_PROMPTS) * 100, 100)
  const remainingSeconds = Math.max(REQUIRED_SECONDS - elapsedSeconds, 0)

  return (
    <Card className={isUnlocked ? 'border-green-500 bg-green-50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Think First Timer</span>
          {isUnlocked && (
            <span className="text-sm font-normal text-green-600">
              ✓ AI 피드백 활성화됨
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isUnlocked ? (
          <>
            {/* Explanation */}
            <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-800">
              <p className="font-medium mb-1">AI 피드백 잠금 해제 조건:</p>
              <ul className="space-y-1">
                <li>• 5분 이상 스스로 고민하기 <span className="text-gray-500">또는</span></li>
                <li>• 구조화 질문 3개 이상 작성하기</li>
              </ul>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-5xl font-mono font-bold tabular-nums">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {remainingSeconds > 0
                  ? `${formatTime(remainingSeconds)} 남음`
                  : '시간 조건 충족!'}
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              {/* Time Progress */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>시간 진행</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Prompt Progress */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>구조화 질문</span>
                  <span>{promptsCompleted}/{REQUIRED_PROMPTS}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${promptProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={handleStart} className="flex-1">
                  {elapsedSeconds > 0 ? '계속하기' : '시작하기'}
                </Button>
              ) : (
                <Button onClick={handlePause} variant="outline" className="flex-1">
                  일시정지
                </Button>
              )}
            </div>

            {/* Timer Status */}
            {isRunning && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                고민 중...
              </div>
            )}
          </>
        ) : (
          /* Unlocked State */
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-green-700 font-medium">
              축하합니다! AI 피드백이 활성화되었습니다.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {elapsedSeconds >= REQUIRED_SECONDS
                ? `${formatTime(elapsedSeconds)} 동안 깊이 고민했습니다`
                : `${promptsCompleted}개의 구조화 질문을 작성했습니다`}
            </p>
          </div>
        )}

        {/* Philosophy */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          "AI 없이 스스로 고민하는 시간이 진짜 실력을 만든다"
        </div>
      </CardContent>
    </Card>
  )
}
