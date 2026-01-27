'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThinkFirstTimer } from './ThinkFirstTimer'
import type { IncubatorIdea } from '@/types'

interface IdeaFormProps {
  idea?: IncubatorIdea | null
  onSubmit: (idea: IncubatorIdea) => void
  onRequestFeedback: (idea: IncubatorIdea) => void
  onConvert: (idea: IncubatorIdea) => void
  isRequestingFeedback?: boolean
}

const structuredPrompts = [
  { key: 'problemStatement', label: '해결하려는 문제', placeholder: '어떤 문제를 해결하나요?' },
  { key: 'targetAudience', label: '타겟 고객', placeholder: '누가 이 문제를 겪고 있나요?' },
  { key: 'uniqueValue', label: '차별화 포인트', placeholder: '기존 솔루션과 뭐가 다른가요?' },
  { key: 'mvpFeatures', label: 'MVP 기능', placeholder: '첫 버전에 꼭 필요한 기능은?' },
  { key: 'revenueModel', label: '수익 모델', placeholder: '어떻게 돈을 벌 건가요?' },
  { key: 'biggestRisk', label: '가장 큰 리스크', placeholder: '실패할 수 있는 가장 큰 이유는?' },
] as const

type PromptKey = typeof structuredPrompts[number]['key']

export function IdeaForm({
  idea,
  onSubmit,
  onRequestFeedback,
  onConvert,
  isRequestingFeedback = false,
}: IdeaFormProps) {
  const [rawIdea, setRawIdea] = useState('')
  const [prompts, setPrompts] = useState<Record<PromptKey, string>>({
    problemStatement: '',
    targetAudience: '',
    uniqueValue: '',
    mvpFeatures: '',
    revenueModel: '',
    biggestRisk: '',
  })
  const [thinkingDuration, setThinkingDuration] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showStructuredPrompts, setShowStructuredPrompts] = useState(false)

  // Load idea data
  useEffect(() => {
    if (idea) {
      setRawIdea(idea.rawIdea)
      setPrompts({
        problemStatement: idea.problemStatement || '',
        targetAudience: idea.targetAudience || '',
        uniqueValue: idea.uniqueValue || '',
        mvpFeatures: idea.mvpFeatures || '',
        revenueModel: idea.revenueModel || '',
        biggestRisk: idea.biggestRisk || '',
      })
      setThinkingDuration(idea.thinkingDuration)
      setIsUnlocked(idea.stage === 'ai_feedback' || idea.stage === 'ready')
    }
  }, [idea])

  // Count completed prompts
  const completedPrompts = Object.values(prompts).filter((v) => v.trim().length > 0).length

  const handlePromptChange = (key: PromptKey, value: string) => {
    setPrompts((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    if (!rawIdea.trim()) return

    const now = new Date().toISOString()
    const updatedIdea: IncubatorIdea = {
      id: idea?.id || `idea_${Date.now()}`,
      rawIdea: rawIdea.trim(),
      thinkingDuration,
      stage: isUnlocked ? 'ai_feedback' : 'exploring',
      problemStatement: prompts.problemStatement || undefined,
      targetAudience: prompts.targetAudience || undefined,
      uniqueValue: prompts.uniqueValue || undefined,
      mvpFeatures: prompts.mvpFeatures || undefined,
      revenueModel: prompts.revenueModel || undefined,
      biggestRisk: prompts.biggestRisk || undefined,
      aiFeedback: idea?.aiFeedback,
      createdAt: idea?.createdAt || now,
      updatedAt: now,
    }

    onSubmit(updatedIdea)
  }

  const handleUnlock = () => {
    setIsUnlocked(true)
  }

  const handleRequestFeedback = () => {
    if (!rawIdea.trim()) return

    const now = new Date().toISOString()
    const updatedIdea: IncubatorIdea = {
      id: idea?.id || `idea_${Date.now()}`,
      rawIdea: rawIdea.trim(),
      thinkingDuration,
      stage: 'ai_feedback',
      problemStatement: prompts.problemStatement || undefined,
      targetAudience: prompts.targetAudience || undefined,
      uniqueValue: prompts.uniqueValue || undefined,
      mvpFeatures: prompts.mvpFeatures || undefined,
      revenueModel: prompts.revenueModel || undefined,
      biggestRisk: prompts.biggestRisk || undefined,
      createdAt: idea?.createdAt || now,
      updatedAt: now,
    }

    onRequestFeedback(updatedIdea)
  }

  const handleConvertToVenture = () => {
    if (idea) {
      onConvert(idea)
    }
  }

  const ideaId = idea?.id || `new_${Date.now()}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Idea Input */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>아이디어</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Raw Idea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                떠오른 아이디어 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="머릿속에 떠오른 아이디어를 자유롭게 적어보세요..."
                className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                rows={4}
              />
            </div>

            {/* Toggle Structured Prompts */}
            <Button
              variant="outline"
              onClick={() => setShowStructuredPrompts(!showStructuredPrompts)}
              className="w-full"
            >
              {showStructuredPrompts
                ? '구조화 질문 접기'
                : `구조화 질문 펼치기 (${completedPrompts}/6)`}
            </Button>

            {/* Structured Prompts */}
            {showStructuredPrompts && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  3개 이상 작성하면 AI 피드백을 일찍 받을 수 있습니다
                </p>
                {structuredPrompts.map((prompt) => (
                  <div key={prompt.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {prompt.label}
                      {prompts[prompt.key] && (
                        <span className="ml-2 text-green-500">✓</span>
                      )}
                    </label>
                    <textarea
                      value={prompts[prompt.key]}
                      onChange={(e) => handlePromptChange(prompt.key, e.target.value)}
                      placeholder={prompt.placeholder}
                      className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Save Button */}
            <Button onClick={handleSave} disabled={!rawIdea.trim()}>
              저장
            </Button>
          </CardContent>
        </Card>

        {/* AI Feedback */}
        {idea?.aiFeedback && (
          <Card className="border-purple-500 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>AI 피드백</span>
                <span className="text-xs font-normal text-gray-500">
                  {new Date(idea.aiFeedback.generatedAt).toLocaleDateString('ko-KR')}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strengths */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-1">강점</h4>
                <ul className="space-y-1">
                  {idea.aiFeedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-500">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-1">약점</h4>
                <ul className="space-y-1">
                  {idea.aiFeedback.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-red-500">-</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-1">제안</h4>
                <ul className="space-y-1">
                  {idea.aiFeedback.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-blue-500">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div>
                <h4 className="text-sm font-medium text-purple-700 mb-1">다음 단계</h4>
                <ol className="space-y-1">
                  {idea.aiFeedback.nextSteps.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-purple-500">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Convert to Venture */}
              <Button onClick={handleConvertToVenture} className="w-full">
                벤처로 전환하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Think First Timer */}
      <div className="space-y-6">
        <ThinkFirstTimer
          ideaId={ideaId}
          promptsCompleted={completedPrompts}
          onUnlock={handleUnlock}
          onTimeUpdate={setThinkingDuration}
          initialSeconds={thinkingDuration}
        />

        {/* Request Feedback Button */}
        {isUnlocked && !idea?.aiFeedback && (
          <Button
            onClick={handleRequestFeedback}
            disabled={!rawIdea.trim() || isRequestingFeedback}
            className="w-full"
            size="lg"
          >
            {isRequestingFeedback ? 'AI 분석 중...' : 'AI 피드백 받기'}
          </Button>
        )}

        {/* Tips */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Think First 팁</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• 처음 5분은 AI 없이 스스로 고민하세요</li>
            <li>• 구조화 질문에 답하면 더 좋은 피드백을 받습니다</li>
            <li>• 실패할 이유를 먼저 생각해보세요</li>
            <li>• MVP는 정말 최소한으로 시작하세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
