'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Calendar,
  Lightbulb,
  TrendingUp,
  Globe,
  MessageSquare,
  Check,
  Clock,
  Edit,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getTopicHistory, updateTopicHistoryStatus } from '@/lib/firebase/firestore'
import type { TopicHistory, TopicSuggestion } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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

const statusConfig: Record<TopicHistory['status'], { label: string; color: string; icon: React.ReactNode }> = {
  generated: { label: '생성됨', color: 'bg-purple-100 text-purple-700', icon: <Sparkles className="w-3 h-3" /> },
  in_progress: { label: '작성 중', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
  completed: { label: '완료', color: 'bg-green-100 text-green-700', icon: <Check className="w-3 h-3" /> },
}

function TopicCard({ topic, index }: { topic: TopicSuggestion; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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

      <CardContent>
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

        {/* 검색 키워드 */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">검색 키워드</h4>
          <div className="flex flex-wrap gap-1">
            {topic.searchKeywords.map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* 트렌드 분석 (Gemini 결과) */}
        {topic.trendAnalysis && (
          <div className="border-t pt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 w-full"
            >
              <TrendingUp className="w-4 h-4" />
              <span>트렌드 분석 보기</span>
              <span className="ml-auto text-xs">{expanded ? '접기' : '펼치기'}</span>
            </button>

            {expanded && (
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

                {/* 검색 시점 */}
                <p className="text-xs text-blue-500 text-right">
                  검색 시점: {format(new Date(topic.trendAnalysis.searchedAt), 'PPP p', { locale: ko })}
                </p>
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
                <div key={i} className="text-sm bg-gray-50 rounded p-3">
                  <div className="font-medium text-gray-700">{insight.title}</div>
                  <div className="text-gray-600 text-xs mt-1">{insight.content}</div>
                  <div className="text-gray-400 text-xs mt-1">방: {insight.roomName}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TopicDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const [history, setHistory] = useState<TopicHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function loadHistory() {
      if (!user || !id) return

      try {
        const data = await getTopicHistory(user.uid, id)
        setHistory(data)
      } catch (error) {
        console.error('Failed to load topic history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user, id])

  const handleStatusChange = async (newStatus: TopicHistory['status']) => {
    if (!user || !history) return

    setUpdating(true)
    try {
      await updateTopicHistoryStatus(user.uid, history.id, newStatus)
      setHistory(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('상태 업데이트에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!history) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/kakao/topics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">글감을 찾을 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/kakao/topics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge className={statusConfig[history.status].color}>
                {statusConfig[history.status].icon}
                <span className="ml-1">{statusConfig[history.status].label}</span>
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(history.generatedAt), 'PPP', { locale: ko })}
              </span>
            </div>
            <h1 className="text-xl font-bold mt-2">AI 글감 상세</h1>
          </div>
        </div>

        {/* 상태 변경 버튼 */}
        <div className="flex gap-2">
          {history.status === 'generated' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('in_progress')}
              disabled={updating}
            >
              <Edit className="w-4 h-4 mr-2" />
              작성 시작
            </Button>
          )}
          {history.status === 'in_progress' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('completed')}
              disabled={updating}
            >
              <Check className="w-4 h-4 mr-2" />
              완료로 표시
            </Button>
          )}
        </div>
      </div>

      {/* 요약 정보 */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">인사이트 요약</p>
              <p className="text-gray-700 mt-1">{history.insightSummary}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-600">활용 인사이트</p>
              <p className="text-2xl font-bold text-purple-700">{history.totalInsightsUsed}개</p>
            </div>
          </div>
          {history.roomsUsed.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-xs text-purple-600 mb-1">참조한 방</p>
              <div className="flex flex-wrap gap-1">
                {history.roomsUsed.map((room, i) => (
                  <Badge key={i} variant="outline" className="bg-white text-xs">
                    {room}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 글감 목록 */}
      <div className="space-y-4">
        {history.topics.map((topic, index) => (
          <TopicCard key={topic.id} topic={topic} index={index} />
        ))}
      </div>
    </div>
  )
}
