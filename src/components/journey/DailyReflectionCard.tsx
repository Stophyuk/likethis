'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DailyReflection, JourneyDayStats } from '@/types'

interface DailyReflectionCardProps {
  date: string
  stats: JourneyDayStats
  reflection: DailyReflection | null
  onGenerateQuestions: () => Promise<string[]>
  onSaveReflection: (reflection: DailyReflection) => void
  isGenerating?: boolean
}

export function DailyReflectionCard({
  date,
  stats,
  reflection,
  onGenerateQuestions,
  onSaveReflection,
  isGenerating = false,
}: DailyReflectionCardProps) {
  const [questions, setQuestions] = useState<string[]>(reflection?.questions || [])
  const [answers, setAnswers] = useState<string[]>(reflection?.answers || [])
  const [isEditing, setIsEditing] = useState(false)

  const handleGenerateQuestions = async () => {
    const generated = await onGenerateQuestions()
    setQuestions(generated)
    setAnswers(new Array(generated.length).fill(''))
    setIsEditing(true)
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSave = () => {
    const newReflection: DailyReflection = {
      id: `reflection_${date}`,
      date,
      questions,
      answers,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
    }
    onSaveReflection(newReflection)
    setIsEditing(false)
  }

  const hasAnswers = answers.some(a => a.trim())
  const isToday = date === new Date().toISOString().split('T')[0]
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>Daily Reflection</span>
            {reflection && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                완료
              </span>
            )}
          </span>
          <span className="text-sm font-normal text-gray-500">{formattedDate}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Day Summary */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">세션</span>
            <span className="font-semibold">{stats.sessionCount}회</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Pure</span>
            <span className="font-semibold text-amber-600">{stats.totalPureMinutes}분</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">AI</span>
            <span className="font-semibold">{stats.totalAiAssistedMinutes}분</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">실패 기록</span>
            <span className="font-semibold">{stats.failLogCount}개</span>
          </div>
        </div>

        {/* No reflection yet */}
        {!reflection && !isEditing && (
          <div className="text-center py-6">
            {stats.sessionCount === 0 ? (
              <div className="text-gray-500">
                <p className="text-4xl mb-2">🌱</p>
                <p>오늘 Deep Work 세션을 시작하면</p>
                <p className="text-sm">맞춤 성찰 질문을 받을 수 있습니다</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  오늘의 활동을 바탕으로<br />
                  AI가 맞춤 성찰 질문을 생성합니다
                </p>
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating}
                >
                  {isGenerating ? '생성 중...' : '성찰 질문 받기'}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Questions & Answers */}
        {(reflection || isEditing) && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <p className="font-medium text-gray-800">
                  Q{index + 1}. {question}
                </p>
                {isEditing ? (
                  <textarea
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="생각을 자유롭게 적어보세요..."
                    className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={3}
                  />
                ) : reflection?.answers[index] ? (
                  <p className="text-gray-600 pl-4 border-l-2 border-gray-200">
                    {reflection.answers[index]}
                  </p>
                ) : (
                  <p className="text-gray-400 italic pl-4">답변 없음</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={!hasAnswers} className="flex-1">
              성찰 저장
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              취소
            </Button>
          </div>
        )}

        {reflection && !isEditing && isToday && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuestions(reflection.questions)
                setAnswers(reflection.answers)
                setIsEditing(true)
              }}
            >
              수정하기
            </Button>
          </div>
        )}

        {/* Build in Public Prompt */}
        {reflection && reflection.answers.some(a => a.trim()) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Build in Public 공유하기
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              오늘의 성찰을 SNS에 공유해보세요
            </p>
            <Button variant="outline" size="sm">
              공유 콘텐츠 생성
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
