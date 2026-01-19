'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Platform, RecommendedAction } from '@/types'

interface RecommendationCardProps {
  recommendation: RecommendedAction
  onComplete?: (id: string) => void
  onSkip?: (id: string) => void
}

export function RecommendationCard({ recommendation, onComplete, onSkip }: RecommendationCardProps) {
  const [isCompleted, setIsCompleted] = useState(recommendation.is_completed)
  const [isSkipped, setIsSkipped] = useState(recommendation.is_skipped)

  const handleComplete = () => {
    setIsCompleted(true)
    onComplete?.(recommendation.id)
  }

  const handleSkip = () => {
    setIsSkipped(true)
    onSkip?.(recommendation.id)
  }

  if (isCompleted || isSkipped) {
    return null
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: getPlatformColor(recommendation.platform) }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">{getPlatformEmoji(recommendation.platform)}</span>
          <span className="font-medium">{getActionTypeLabel(recommendation.action_type)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">{recommendation.reason}</p>

        {recommendation.target_content && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-700">{recommendation.target_content}</p>
          </div>
        )}

        {recommendation.sample_text && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <p className="text-xs text-blue-600 mb-1">예시 텍스트:</p>
            <p className="text-sm text-gray-700">{recommendation.sample_text}</p>
          </div>
        )}

        {recommendation.target_url && (
          <a
            href={recommendation.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline block"
          >
            링크 열기 →
          </a>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleComplete} size="sm" className="flex-1">
            완료
          </Button>
          <Button onClick={handleSkip} variant="outline" size="sm" className="flex-1">
            건너뛰기
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getPlatformEmoji(platform: Platform): string {
  const emojis: Record<Platform, string> = {
    x: '𝕏',
    threads: '🧵',
    producthunt: '🚀',
    medium: '📝',
    naver: '🟢',
    youtube: '▶️',
    instagram: '📸',
    reddit: '🤖',
    linkedin: '💼',
    indiehackers: '🛠️',
    kakao: '💬',
  }
  return emojis[platform] || '📱'
}

function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    x: '#000000',
    threads: '#000000',
    producthunt: '#DA552F',
    medium: '#000000',
    naver: '#03C75A',
    youtube: '#FF0000',
    instagram: '#E4405F',
    reddit: '#FF4500',
    linkedin: '#0A66C2',
    indiehackers: '#0E2439',
    kakao: '#FEE500',
  }
  return colors[platform] || '#6B7280'
}

function getActionTypeLabel(actionType: string): string {
  const labels: Record<string, string> = {
    follow: '팔로우하기',
    comment: '댓글 달기',
    like: '좋아요/업보트',
    post: '글 작성',
    karma: '카르마 획득',
    share: '공유하기',
  }
  return labels[actionType] || actionType
}
