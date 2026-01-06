'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Check, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import type { Platform } from '@/types'

interface TransformResult {
  transformed_content: string
  hashtags: string[]
  tips: string[]
  character_count: number
}

const SUPPORTED_PLATFORMS: Platform[] = ['x', 'linkedin', 'medium', 'instagram', 'reddit']

type Step = 'idea' | 'draft' | 'transform'

export default function ComposePage() {
  // Step 관리
  const [step, setStep] = useState<Step>('idea')

  // Step 1: 아이디어
  const [topic, setTopic] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)

  // Step 2: 초안
  const [draft, setDraft] = useState('')

  // Step 3: 변환 (기존)
  const [originalContent, setOriginalContent] = useState('')
  const [results, setResults] = useState<Record<string, TransformResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  // 관심사 로드
  const [interests, setInterests] = useState<string[]>([])
  useEffect(() => {
    const saved = localStorage.getItem('likethis_interests')
    if (saved) {
      setInterests(JSON.parse(saved))
    }
  }, [])

  // AI 초안 생성
  const handleGenerateDraft = async () => {
    if (!topic.trim() || !keyPoints.trim()) return

    setDraftLoading(true)
    try {
      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          keyPoints,
          interests,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate draft')

      const data = await response.json()
      setDraft(data.draft)
      setStep('draft')
    } catch (error) {
      console.error('Generate draft error:', error)
      alert('초안 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setDraftLoading(false)
    }
  }

  // 초안을 변환 단계로 전달
  const handleUseDraft = () => {
    setOriginalContent(draft)
    setStep('transform')
  }

  // 직접 작성 모드로 전환
  const handleSkipDraft = () => {
    setStep('transform')
  }

  const handleTransform = async (platform: string) => {
    if (!originalContent.trim()) return

    setLoading(prev => ({ ...prev, [platform]: true }))

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: originalContent,
          targetPlatform: platform,
        }),
      })

      if (!response.ok) throw new Error('Transform failed')

      const data = await response.json()
      setResults(prev => ({ ...prev, [platform]: data }))
    } catch (error) {
      console.error('Transform error:', error)
    } finally {
      setLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  const handleTransformAll = async () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      await handleTransform(platform)
    }
  }

  const handleCopy = async (platform: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(platform)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">크로스포스팅</h1>
        <p className="text-gray-600 mt-2">
          아이디어에서 시작해 모든 플랫폼에 맞게 변환하세요
        </p>
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStep('idea')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            step === 'idea' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          1. 아이디어
        </button>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => draft && setStep('draft')}
          disabled={!draft}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            step === 'draft' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          } ${!draft ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          2. 초안
        </button>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setStep('transform')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            step === 'transform' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          3. 변환
        </button>
      </div>

      {/* Step 1: 아이디어 입력 */}
      {step === 'idea' && (
        <Card>
          <CardHeader>
            <CardTitle>무슨 글을 쓸까요?</CardTitle>
            <CardDescription>주제와 핵심 내용을 입력하면 AI가 초안을 작성해드립니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">주제</label>
              <Input
                placeholder="예: 1인개발 1주년 회고"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">핵심 내용</label>
              <Textarea
                placeholder="bullet point로 적어보세요&#10;- 1년간 만든 프로젝트들&#10;- 가장 힘들었던 순간&#10;- 배운 점과 앞으로의 계획"
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateDraft}
                disabled={!topic.trim() || !keyPoints.trim() || draftLoading}
              >
                {draftLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 초안 생성
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleSkipDraft}>
                직접 작성하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 초안 검토 */}
      {step === 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>AI 초안</CardTitle>
            <CardDescription>초안을 수정하고 마음에 들면 변환 단계로 진행하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              className="text-base"
            />
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{draft.length}자</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('idea')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                다시 작성
              </Button>
              <Button onClick={handleUseDraft}>
                이대로 변환하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 플랫폼 변환 (기존) */}
      {step === 'transform' && (
        <>
          {/* 원본 콘텐츠 입력 */}
          <Card>
            <CardHeader>
              <CardTitle>원본 콘텐츠</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="공유하고 싶은 내용을 자유롭게 작성하세요..."
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleTransformAll}
                  disabled={!originalContent.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  전체 플랫폼 변환
                </Button>
                <span className="text-sm text-gray-500 self-center">
                  {originalContent.length}자
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 플랫폼별 결과 */}
          <Tabs defaultValue="x">
            <TabsList className="grid grid-cols-5 w-full">
              {SUPPORTED_PLATFORMS.map((platform) => {
                const guide = PLATFORM_GUIDES[platform]
                return (
                  <TabsTrigger key={platform} value={platform}>
                    {guide?.icon} {guide?.name?.split(' ')[0]}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {SUPPORTED_PLATFORMS.map((platform) => {
              const guide = PLATFORM_GUIDES[platform]
              const result = results[platform]
              const isLoading = loading[platform]

              return (
                <TabsContent key={platform} value={platform}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {guide?.icon} {guide?.name}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransform(platform)}
                        disabled={!originalContent.trim() || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          '변환'
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result ? (
                        <>
                          <div className="relative">
                            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                              {result.transformed_content}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => handleCopy(platform, result.transformed_content)}
                            >
                              {copied === platform ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{result.character_count}자</span>
                            {result.hashtags?.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {result.hashtags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {result.tips?.length > 0 && (
                            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                              {result.tips[0]}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          원본 콘텐츠를 입력하고 변환 버튼을 클릭하세요
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </>
      )}
    </div>
  )
}
