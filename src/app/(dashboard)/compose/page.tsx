'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Check, Sparkles } from 'lucide-react'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import type { Platform } from '@/types'

interface TransformResult {
  transformed_content: string
  hashtags: string[]
  tips: string[]
  character_count: number
}

const SUPPORTED_PLATFORMS: Platform[] = ['x', 'linkedin', 'medium', 'instagram', 'reddit']

export default function ComposePage() {
  const [originalContent, setOriginalContent] = useState('')
  const [results, setResults] = useState<Record<string, TransformResult>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

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
          한 번 작성하고 여러 플랫폼에 맞게 변환하세요
        </p>
      </div>

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
    </div>
  )
}
