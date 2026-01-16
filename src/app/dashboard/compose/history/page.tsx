'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Copy, Check, Trash2, Loader2, Calendar, FileText } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPostingHistoryList, deletePostingHistory } from '@/lib/firebase/firestore'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import type { PostingHistory, Platform } from '@/types'

export default function PostingHistoryPage() {
  const { user } = useAuth()
  const [histories, setHistories] = useState<PostingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHistory, setSelectedHistory] = useState<PostingHistory | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadHistories = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await getPostingHistoryList(user.uid)
      // deleted가 아닌 항목만 필터링
      setHistories(list.filter(h => !('deleted' in h && h.deleted)))
    } catch (error) {
      console.error('Load histories error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadHistories()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    if (!confirm('이 히스토리를 삭제하시겠습니까?')) return

    setDeleting(id)
    try {
      await deletePostingHistory(user.uid, id)
      setHistories(prev => prev.filter(h => h.id !== id))
      if (selectedHistory?.id === id) {
        setSelectedHistory(null)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPlatformIcon = (platform: Platform) => {
    const guide = PLATFORM_GUIDES[platform]
    return guide?.icon || '📝'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compose">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">포스팅 히스토리</h1>
          <p className="text-gray-600 mt-1">
            이전에 작성한 컨텐츠를 확인하고 재사용하세요
          </p>
        </div>
      </div>

      {histories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">아직 저장된 포스팅이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1">
              크로스포스팅에서 컨텐츠를 변환한 후 저장해보세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 히스토리 목록 */}
          <div className="lg:col-span-1 space-y-3">
            {histories.map((history) => (
              <Card
                key={history.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedHistory?.id === history.id ? 'ring-2 ring-gray-900' : ''
                }`}
                onClick={() => setSelectedHistory(history)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {history.topic || '제목 없음'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(history.createdAt)}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {history.platformContents.map((pc, idx) => (
                          <span key={idx} className="text-sm">
                            {getPlatformIcon(pc.platform)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(history.id)
                      }}
                      disabled={deleting === history.id}
                    >
                      {deleting === history.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 상세 보기 */}
          <div className="lg:col-span-2">
            {selectedHistory ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedHistory.topic || '제목 없음'}</CardTitle>
                  <CardDescription>
                    {formatDate(selectedHistory.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 원본 초안 */}
                  <div>
                    <h4 className="font-medium mb-2">원본 초안</h4>
                    <div className="relative">
                      <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                        {selectedHistory.originalDraft}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopy('original', selectedHistory.originalDraft)}
                      >
                        {copied === 'original' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 핵심 내용 */}
                  {selectedHistory.keyPoints && (
                    <div>
                      <h4 className="font-medium mb-2">핵심 내용</h4>
                      <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                        {selectedHistory.keyPoints}
                      </div>
                    </div>
                  )}

                  {/* 플랫폼별 변환 결과 */}
                  {selectedHistory.platformContents.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">플랫폼별 변환</h4>
                      <Tabs defaultValue={selectedHistory.platformContents[0]?.platform}>
                        <TabsList>
                          {selectedHistory.platformContents.map((pc) => (
                            <TabsTrigger key={pc.platform} value={pc.platform}>
                              {getPlatformIcon(pc.platform)} {PLATFORM_GUIDES[pc.platform]?.name?.split(' ')[0] || pc.platform}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {selectedHistory.platformContents.map((pc) => (
                          <TabsContent key={pc.platform} value={pc.platform}>
                            <div className="relative">
                              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                                {pc.content}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => handleCopy(pc.platform, pc.content)}
                              >
                                {copied === pc.platform ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            {pc.hashtags.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-2">
                                {pc.hashtags.map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {pc.postedAt && (
                              <p className="text-sm text-green-600 mt-2">
                                포스팅됨: {formatDate(pc.postedAt)}
                              </p>
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  왼쪽 목록에서 히스토리를 선택하세요
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
