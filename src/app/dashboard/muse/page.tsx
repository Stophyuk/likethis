'use client'

import { useState, useEffect } from 'react'
import { NewsInput, TranslatorGlossary, GeneratedContent } from '@/components/muse'

interface SearchResult {
  blockId: string
  theme: string
  title: string
  content: string
  keywords: string[]
  similarity: number
  source: 'vector' | 'keyword'
}

interface GenerateResult {
  translatedContent: string
  philosophyContext: string
  relatedBlocks: SearchResult[]
  translatedTerms: string[]
}

export default function MusePage() {
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [originalContent, setOriginalContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load translations on mount
  useEffect(() => {
    async function loadTranslations() {
      try {
        const response = await fetch('/api/muse/generate')
        const data = await response.json()
        setTranslations(data.translations || {})
      } catch (error) {
        console.error('Failed to load translations:', error)
      }
    }
    loadTranslations()
  }, [])

  const handleSubmit = async (
    content: string,
    options: {
      targetAudience: 'general' | 'entrepreneur'
      includePhilosophy: boolean
    }
  ) => {
    setIsLoading(true)
    setError(null)
    setOriginalContent(content)

    try {
      const response = await fetch('/api/muse/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsContent: content,
          ...options,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Generate error:', error)
      setError('콘텐츠 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setOriginalContent('')
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Muse</h1>
        <p className="text-gray-600">기술 뉴스를 비개발자 언어로 번역 + 철학적 맥락 주입</p>
      </div>

      {/* Philosophy Quote */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎭</div>
          <div>
            <p className="text-gray-700 italic">
              &ldquo;AI 시대에 답은 싸고 질문은 비싸다.
              기술이 평준화되면, 통찰과 해석이 가치가 된다.&rdquo;
            </p>
            <p className="text-sm text-gray-500 mt-2">— 켄타우로스 모델</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input or Result */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Reset Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← 새로운 번역 시작
                </button>
              </div>

              {/* Generated Content */}
              <GeneratedContent
                translatedContent={result.translatedContent}
                philosophyContext={result.philosophyContext}
                relatedBlocks={result.relatedBlocks}
                translatedTerms={result.translatedTerms}
                originalContent={originalContent}
              />
            </>
          ) : (
            <>
              {/* Input Form */}
              <NewsInput onSubmit={handleSubmit} isLoading={isLoading} />

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Glossary */}
        <div className="space-y-6">
          <TranslatorGlossary
            translations={translations}
            highlightedTerms={result?.translatedTerms || []}
          />

          {/* How it works */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">어떻게 작동하나요?</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">1</span>
                <span>기술 뉴스나 트렌드를 입력합니다</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">2</span>
                <span>AI가 관련된 철학적 맥락을 검색합니다</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">3</span>
                <span>비개발자도 이해할 수 있는 언어로 번역합니다</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">4</span>
                <span>기회와 시사점을 함께 제시합니다</span>
              </li>
            </ol>
          </div>

          {/* Use Cases */}
          <div className="p-4 bg-amber-50 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-2">활용 예시</h3>
            <ul className="space-y-1 text-sm text-amber-800">
              <li>• 뉴스레터에 기술 트렌드 해설 추가</li>
              <li>• 비개발자 팀원에게 기술 변화 설명</li>
              <li>• SNS에 인사이트 공유</li>
              <li>• 창업 아이디어 발굴</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
