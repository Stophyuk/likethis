'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Sparkles,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Globe,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { TopicSuggestion } from '@/types'

interface TopicSuggestionsModalProps {
  isOpen: boolean
  onClose: () => void
  topics: TopicSuggestion[]
  insightSummary: string
  onSave: () => Promise<void>
}

const platformEmoji: Record<string, string> = {
  medium: 'M',
  naver: 'N',
  linkedin: 'in',
  x: 'X',
  threads: 'TH',
  youtube: 'YT',
  reddit: 'R',
  producthunt: 'PH',
  instagram: 'IG',
  indiehackers: 'IH',
  kakao: 'K',
}

export function TopicSuggestionsModal({
  isOpen,
  onClose,
  topics,
  insightSummary,
  onSave,
}: TopicSuggestionsModalProps) {
  const [saving, setSaving] = useState(false)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedTopic(expandedTopic === id ? null : id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold">AI 글감 제안</h2>
              <p className="text-sm text-gray-600">{topics.length}개의 글감이 생성되었습니다</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 요약 */}
        {insightSummary && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <p className="text-sm text-gray-700">
              <span className="font-medium">인사이트 요약:</span> {insightSummary}
            </p>
          </div>
        )}

        {/* 글감 목록 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {topics.map((topic, index) => (
            <Card key={topic.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        글감 {index + 1}
                      </Badge>
                      {topic.platforms.map(platform => (
                        <Badge key={platform} variant="secondary" className="text-xs">
                          {platformEmoji[platform] || platform}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                    <CardDescription className="mt-2">{topic.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* 차별화 포인트 */}
                <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-amber-700">차별화 포인트</span>
                    <p className="text-sm text-amber-900">{topic.angle}</p>
                  </div>
                </div>

                {/* 핵심 포인트 */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">핵심 포인트</h4>
                  <ul className="space-y-1">
                    {topic.keyPoints.map((point, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-purple-500">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 트렌드 분석 (Gemini 결과) */}
                {topic.trendAnalysis && (
                  <div className="border-t pt-4">
                    <button
                      onClick={() => toggleExpand(topic.id)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 w-full"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>트렌드 분석</span>
                      {expandedTopic === topic.id ? (
                        <ChevronUp className="w-4 h-4 ml-auto" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      )}
                    </button>

                    {expandedTopic === topic.id && (
                      <div className="mt-3 space-y-3 bg-blue-50 rounded-lg p-4">
                        {/* 현재 트렌드 */}
                        <div>
                          <h5 className="text-xs font-medium text-blue-700 flex items-center gap-1 mb-1">
                            <Globe className="w-3 h-3" />
                            현재 트렌드
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {topic.trendAnalysis.currentTrends.map((trend, i) => (
                              <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                {trend}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* 커뮤니티 반응 */}
                        <div>
                          <h5 className="text-xs font-medium text-blue-700 flex items-center gap-1 mb-1">
                            <MessageSquare className="w-3 h-3" />
                            커뮤니티 반응
                          </h5>
                          <p className="text-sm text-blue-900">{topic.trendAnalysis.communityBuzz}</p>
                        </div>

                        {/* 최근 글/뉴스 */}
                        {topic.trendAnalysis.recentArticles.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-blue-700 mb-1">최근 관련 글</h5>
                            <ul className="space-y-1">
                              {topic.trendAnalysis.recentArticles.map((article, i) => (
                                <li key={i} className="text-xs text-blue-800">
                                  • {article}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 추천 훅 */}
                        <div className="border-t border-blue-200 pt-2">
                          <h5 className="text-xs font-medium text-blue-700 mb-1">추천 도입부</h5>
                          <p className="text-sm text-blue-900 italic">&ldquo;{topic.trendAnalysis.suggestedHook}&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 관련 인사이트 */}
                {topic.relatedInsights.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">참고한 인사이트</h4>
                    <div className="space-y-2">
                      {topic.relatedInsights.map((insight, i) => (
                        <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <span className="font-medium">{insight.title}</span>
                          <span className="text-gray-400 ml-2">({insight.roomName})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-500">저장하면 히스토리에서 다시 볼 수 있습니다</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>저장 중...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
