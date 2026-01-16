'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, ImageIcon, Link as LinkIcon, User } from 'lucide-react'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import type { PlatformProfileRecommendation } from '@/types'

interface PlatformProfileResultProps {
  recommendations: PlatformProfileRecommendation[]
}

export function PlatformProfileResult({ recommendations }: PlatformProfileResultProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI 생성 결과</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={recommendations[0]?.platform}>
          <TabsList className="flex flex-wrap gap-1">
            {recommendations.map((rec) => {
              const guide = PLATFORM_GUIDES[rec.platform]
              return (
                <TabsTrigger key={rec.platform} value={rec.platform}>
                  {guide?.icon} {guide?.name?.split(' ')[0] || rec.platform}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {recommendations.map((rec) => {
            return (
              <TabsContent key={rec.platform} value={rec.platform} className="space-y-6 mt-4">
                {/* 메인 바이오 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium">프로필 바이오</h4>
                  </div>
                  <div className="relative">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{rec.bio}</p>
                      <p className="text-xs text-gray-400 mt-2">{rec.bio.length}자</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopy(`${rec.platform}-bio`, rec.bio)}
                    >
                      {copied === `${rec.platform}-bio` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* 대안 바이오 */}
                  {rec.bioAlternatives && rec.bioAlternatives.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-500">대안 문구:</p>
                      {rec.bioAlternatives.map((alt, idx) => (
                        <div key={idx} className="relative">
                          <div className="p-3 bg-gray-50 rounded-lg text-sm">
                            {alt}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => handleCopy(`${rec.platform}-alt-${idx}`, alt)}
                          >
                            {copied === `${rec.platform}-alt-${idx}` ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 프로필 사진 팁 */}
                {rec.profilePhotoTips && rec.profilePhotoTips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium">프로필 사진 팁</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {rec.profilePhotoTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 헤더 이미지 팁 */}
                {rec.headerImageTips && rec.headerImageTips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium">헤더/배경 이미지 팁</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {rec.headerImageTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 링크 추천 */}
                {rec.linkRecommendations && rec.linkRecommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-gray-600" />
                      <h4 className="font-medium">프로필 링크 추천</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {rec.linkRecommendations.map((link, idx) => (
                        <li key={idx}>{link}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
