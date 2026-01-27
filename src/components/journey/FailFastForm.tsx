'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { FailFastLog } from '@/types'

interface FailFastFormProps {
  onSubmit: (log: FailFastLog) => void
  recentLogs: FailFastLog[]
}

export function FailFastForm({ onSubmit, recentLogs }: FailFastFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [whatTried, setWhatTried] = useState('')
  const [whatFailed, setWhatFailed] = useState('')
  const [whatLearned, setWhatLearned] = useState('')
  const [nextAction, setNextAction] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!whatTried.trim() || !whatFailed.trim()) return

    const log: FailFastLog = {
      id: `fail_${Date.now()}`,
      whatTried: whatTried.trim(),
      whatFailed: whatFailed.trim(),
      whatLearned: whatLearned.trim(),
      nextAction: nextAction.trim(),
      createdAt: new Date().toISOString(),
    }

    onSubmit(log)

    // Reset form
    setWhatTried('')
    setWhatFailed('')
    setWhatLearned('')
    setNextAction('')
    setIsExpanded(false)
  }

  const canSubmit = whatTried.trim() && whatFailed.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>Fail-Fast Log</span>
            <span className="text-sm font-normal text-gray-500">
              빠르게 실패하고, 빠르게 배우기
            </span>
          </span>
          {!isExpanded && (
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(true)}>
              + 기록하기
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {isExpanded && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                무엇을 시도했나요? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={whatTried}
                onChange={(e) => setWhatTried(e.target.value)}
                placeholder="예: 새로운 마케팅 채널로 TikTok 광고 테스트"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                무엇이 실패했나요? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={whatFailed}
                onChange={(e) => setWhatFailed(e.target.value)}
                placeholder="예: CTR은 높았지만 전환율이 0.1%로 매우 낮았음"
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                무엇을 배웠나요?
              </label>
              <textarea
                value={whatLearned}
                onChange={(e) => setWhatLearned(e.target.value)}
                placeholder="예: TikTok 사용자층은 우리 제품의 타겟과 맞지 않음"
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                다음 액션은?
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="예: LinkedIn 광고로 B2B 타겟팅 테스트"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!canSubmit} className="flex-1">
                기록 저장
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsExpanded(false)}>
                취소
              </Button>
            </div>
          </form>
        )}

        {/* Recent Logs */}
        {recentLogs.length > 0 ? (
          <div className="space-y-3">
            {recentLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">시도</span>
                      <p className="font-medium">{log.whatTried}</p>
                    </div>
                    <div>
                      <span className="text-xs text-red-500">실패</span>
                      <p className="text-gray-700">{log.whatFailed}</p>
                    </div>
                    {log.whatLearned && (
                      <div>
                        <span className="text-xs text-green-600">배움</span>
                        <p className="text-gray-700">{log.whatLearned}</p>
                      </div>
                    )}
                    {log.nextAction && (
                      <div>
                        <span className="text-xs text-blue-600">다음</span>
                        <p className="text-gray-700">{log.nextAction}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : !isExpanded ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">💡</p>
            <p>아직 기록된 실패가 없습니다</p>
            <p className="text-sm">실패는 성장의 연료입니다</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
