'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface NewsInputProps {
  onSubmit: (content: string, options: {
    targetAudience: 'general' | 'entrepreneur'
    includePhilosophy: boolean
  }) => void
  isLoading?: boolean
}

export function NewsInput({ onSubmit, isLoading = false }: NewsInputProps) {
  const [content, setContent] = useState('')
  const [targetAudience, setTargetAudience] = useState<'general' | 'entrepreneur'>('entrepreneur')
  const [includePhilosophy, setIncludePhilosophy] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSubmit(content, { targetAudience, includePhilosophy })
  }

  const exampleTopics = [
    'OpenAI가 GPT-5를 발표했습니다. 멀티모달 성능이 크게 향상되었고, 추론 능력이 인간 수준에 근접했습니다.',
    'Cursor가 AI 코딩 도구 시장에서 급성장하고 있습니다. 개발자들이 코드 작성 시간을 70% 줄였다고 보고합니다.',
    'No-code 플랫폼 Bubble이 AI 기능을 추가했습니다. 비개발자도 복잡한 앱을 만들 수 있게 되었습니다.',
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>기술 뉴스 입력</span>
          <span className="text-sm font-normal text-gray-500">
            번역할 뉴스나 트렌드를 입력하세요
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Input */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="기술 뉴스, 트렌드, 또는 개발 관련 소식을 붙여넣기 하세요..."
              className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent min-h-[150px]"
              disabled={isLoading}
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            {/* Target Audience */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">타겟:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setTargetAudience('entrepreneur')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    targetAudience === 'entrepreneur'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  창업가
                </button>
                <button
                  type="button"
                  onClick={() => setTargetAudience('general')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    targetAudience === 'general'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  일반인
                </button>
              </div>
            </div>

            {/* Philosophy Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePhilosophy}
                onChange={(e) => setIncludePhilosophy(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600">철학적 맥락 포함</span>
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? '번역 중...' : '비개발자 언어로 번역'}
          </Button>
        </form>

        {/* Example Topics */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">예시 주제:</p>
          <div className="space-y-2">
            {exampleTopics.map((topic, index) => (
              <button
                key={index}
                onClick={() => setContent(topic)}
                className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {topic.slice(0, 80)}...
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
