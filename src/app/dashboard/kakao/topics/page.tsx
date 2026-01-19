'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Trash2, Calendar, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getTopicHistoryList, deleteTopicHistory } from '@/lib/firebase/firestore'
import type { TopicHistory } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const statusLabels: Record<TopicHistory['status'], { label: string; color: string }> = {
  generated: { label: '생성됨', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: '작성 중', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
}

export default function TopicsHistoryPage() {
  const { user } = useAuth()
  const [histories, setHistories] = useState<TopicHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistories() {
      if (!user) return

      try {
        const data = await getTopicHistoryList(user.uid)
        setHistories(data)
      } catch (error) {
        console.error('Failed to load topic histories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistories()
  }, [user])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || !confirm('이 글감을 삭제하시겠습니까?')) return

    setDeleting(id)
    try {
      await deleteTopicHistory(user.uid, id)
      setHistories(prev => prev.filter(h => h.id !== id))
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/kakao">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            AI 글감 히스토리
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            생성된 글감 {histories.length}개
          </p>
        </div>
      </div>

      {/* 목록 */}
      {histories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">아직 생성된 글감이 없습니다</p>
            <Link href="/dashboard/kakao">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                글감 만들러 가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {histories.map(history => (
            <Link href={`/dashboard/kakao/topics/${history.id}`} key={history.id}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusLabels[history.status].color}>
                          {statusLabels[history.status].label}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(history.generatedAt), 'PPP p', { locale: ko })}
                        </span>
                      </div>
                      <CardTitle className="text-lg">
                        {history.topics.map(t => t.title).join(' / ')}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {history.insightSummary}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      onClick={(e) => handleDelete(e, history.id)}
                      disabled={deleting === history.id}
                    >
                      {deleting === history.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>글감 {history.topics.length}개</span>
                    <span>인사이트 {history.totalInsightsUsed}개 활용</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
