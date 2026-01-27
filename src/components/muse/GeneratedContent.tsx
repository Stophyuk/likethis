'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SearchResult {
  blockId: string
  theme: string
  title: string
  content: string
  keywords: string[]
  similarity: number
  source: 'vector' | 'keyword'
}

interface GeneratedContentProps {
  translatedContent: string
  philosophyContext: string
  relatedBlocks: SearchResult[]
  translatedTerms: string[]
  originalContent?: string
}

const themeLabels: Record<string, { label: string; color: string }> = {
  intro: { label: '소개', color: 'bg-blue-100 text-blue-800' },
  benefits: { label: '장점', color: 'bg-green-100 text-green-800' },
  risks: { label: '위험', color: 'bg-red-100 text-red-800' },
  strategy: { label: '전략', color: 'bg-purple-100 text-purple-800' },
  execution: { label: '실행', color: 'bg-orange-100 text-orange-800' },
  conclusion: { label: '결론', color: 'bg-gray-100 text-gray-800' },
}

export function GeneratedContent({
  translatedContent,
  philosophyContext,
  relatedBlocks,
  translatedTerms,
  originalContent,
}: GeneratedContentProps) {
  const [showOriginal, setShowOriginal] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Translated Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>번역된 콘텐츠</span>
              {translatedTerms.length > 0 && (
                <span className="text-xs font-normal text-gray-500">
                  {translatedTerms.length}개 용어 번역됨
                </span>
              )}
            </span>
            <div className="flex gap-2">
              {originalContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? '번역본' : '원문'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(translatedContent, 'content')}
              >
                {copiedField === 'content' ? '복사됨!' : '복사'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showOriginal && originalContent ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 whitespace-pre-wrap">{originalContent}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {translatedContent}
              </p>

              {philosophyContext && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 rounded-lg border border-purple-100">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {philosophyContext}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Translated Terms */}
          {translatedTerms.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">번역된 용어:</p>
              <div className="flex flex-wrap gap-2">
                {translatedTerms.map((term) => (
                  <span
                    key={term}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Philosophy Blocks */}
      {relatedBlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>관련 철학</span>
              <span className="text-sm font-normal text-gray-500">
                바이브코딩 살아남기에서
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedBlocks.map((block) => {
                const themeInfo = themeLabels[block.theme] || {
                  label: block.theme,
                  color: 'bg-gray-100 text-gray-800',
                }

                return (
                  <div
                    key={block.blockId}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${themeInfo.color}`}
                          >
                            {themeInfo.label}
                          </span>
                          <h4 className="font-medium text-gray-900">
                            {block.title}
                          </h4>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {block.content
                            .split('\n')
                            .filter((line) => line.startsWith('- '))
                            .slice(0, 3)
                            .map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          {block.source === 'vector' ? 'AI 매칭' : '키워드 매칭'}
                        </div>
                        <div className="text-sm font-medium text-gray-600">
                          {Math.round(block.similarity * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {block.keywords.slice(0, 5).map((keyword) => (
                        <span
                          key={keyword}
                          className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleCopy(translatedContent, 'share')}
        >
          {copiedField === 'share' ? '복사됨!' : 'SNS 공유용 복사'}
        </Button>
        <Button variant="outline">작성 페이지로 이동</Button>
      </div>
    </div>
  )
}
