'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileText, Loader2, Database, Trash2, Link2, Download, Lightbulb, Briefcase, BookOpen, Zap, WifiOff } from 'lucide-react'
import { parseKakaoCsv, ChatMessage } from '@/lib/csv-parser'

// 오프라인 에러인지 확인
const isOfflineError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('offline') || error.message.includes('network')
  }
  return false
}
import { useAuth } from '@/hooks/useAuth'
import * as firestore from '@/lib/firebase/firestore'

const STORAGE_KEY = 'likethis_kakao_rooms'

interface Room {
  id: string
  room_name: string
  description: string
}

// 새로운 인사이트 중심 응답 구조
interface InsightItem {
  category: 'command' | 'number' | 'solution' | 'tool' | 'trend' | 'business' | 'tech' | 'resource' | 'tip'
  title: string
  content: string
  tags: string[]
  sourceQuotes?: string[]
  extractedAt?: string
}

interface ResourceItem {
  url: string
  title?: string
  description?: string
}

interface AnalysisResult {
  insights: InsightItem[]
  summary: string
  resources: (string | ResourceItem)[]
  noInsights?: boolean
  _meta?: {
    totalMessages: number
    chunksAnalyzed?: number
    analysisMethod: string
    rawInsightCount?: number
    uniqueInsightCount?: number
  }
}

type CategoryFilter = 'all' | 'command' | 'number' | 'solution' | 'tool' | 'trend' | 'business'

export default function KakaoRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [room, setRoom] = useState<Room | null>(null)
  const [newMessages, setNewMessages] = useState<ChatMessage[]>([])
  const [accumulatedData, setAccumulatedData] = useState<firestore.RoomChatData | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { user } = useAuth()
  const [insightHistory, setInsightHistory] = useState<firestore.InsightHistory[]>([])
  const [allInsights, setAllInsights] = useState<firestore.Insight[]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set())
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  // 인사이트 카드 펼치기/접기
  const toggleInsight = (idx: number) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev)
      if (newSet.has(idx)) {
        newSet.delete(idx)
      } else {
        newSet.add(idx)
      }
      return newSet
    })
  }

  // 온라인/오프라인 상태 감지
  useEffect(() => {

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 방 정보 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const rooms = JSON.parse(saved)
      const found = rooms.find((r: Room) => r.id === roomId)
      if (found) setRoom(found)
    }
  }, [roomId])

  // 축적된 메시지 및 인사이트 히스토리 로드
  useEffect(() => {
    if (!user || !roomId || !isOnline) return

    const loadData = async () => {
      try {
        const data = await firestore.getChatMessages(user.uid, roomId)
        if (data.totalCount > 0) {
          setAccumulatedData(data)
        }
      } catch (error) {
        if (!isOfflineError(error)) {
          console.error('Failed to load chat messages:', error)
        }
      }

      try {
        const h = await firestore.getInsightHistoryAll(user.uid, roomId)
        setInsightHistory(h)
      } catch (error) {
        if (!isOfflineError(error)) {
          console.error('Failed to load insight history:', error)
        }
      }

      try {
        const data = await firestore.getAllInsights(user.uid, roomId)
        setAllInsights(data.insights)
      } catch (error) {
        if (!isOfflineError(error)) {
          console.error('Failed to load insights:', error)
        }
      }
    }

    loadData()
  }, [user, roomId, isOnline])

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const parsed = parseKakaoCsv(content)
      console.log('CSV parsed:', parsed.length, 'messages')
      setNewMessages(parsed)
      setResult(null)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      handleFileUpload(file)
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  // 메시지 저장 (축적)
  const handleSaveMessages = async () => {
    if (!user || newMessages.length === 0) return
    if (!isOnline) {
      alert('오프라인 상태에서는 저장할 수 없습니다. 인터넷 연결을 확인해주세요.')
      return
    }
    setSaving(true)
    try {
      const updated = await firestore.saveChatMessages(user.uid, roomId, newMessages)
      setAccumulatedData(updated)
      setNewMessages([]) // 업로드된 메시지 초기화
    } catch (error) {
      if (isOfflineError(error)) {
        alert('오프라인 상태에서는 저장할 수 없습니다. 인터넷 연결을 확인해주세요.')
      } else {
        console.error('Failed to save messages:', error)
        alert('저장에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setSaving(false)
    }
  }

  // 분석 실행
  const handleAnalyze = async () => {
    console.log('handleAnalyze called', { isOnline, user: !!user, newMessages: newMessages.length, accumulatedData: accumulatedData?.totalCount })

    if (!isOnline) {
      alert('오프라인 상태에서는 분석할 수 없습니다. 인터넷 연결을 확인해주세요.')
      return
    }

    let messagesToAnalyze: ChatMessage[] = []

    if (newMessages.length > 0) {
      // 메시지는 Firestore에 저장하지 않고 바로 분석 (1MB 제한 회피)
      messagesToAnalyze = newMessages
    } else if (accumulatedData && accumulatedData.messages.length > 0) {
      messagesToAnalyze = accumulatedData.messages
    }

    if (messagesToAnalyze.length === 0) return

    setAnalyzing(true)
    try {
      const res = await fetch('/api/summarize-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToAnalyze,
          roomName: room?.room_name
        })
      })
      const data = await res.json() as AnalysisResult
      setResult(data)

      // 인사이트 바로 표시 (로그인 여부 무관)
      if (data.insights && data.insights.length > 0) {
        setAllInsights(data.insights as firestore.Insight[])

        // localStorage에도 저장 (콘텐츠 팩토리용)
        const analysisData = {
          insights: data.insights,
          summary: data.summary,
          roomName: room?.room_name,
          analyzedAt: new Date().toISOString(),
        }
        localStorage.setItem('likethis_latest_kakao_analysis', JSON.stringify(analysisData))
        localStorage.setItem(`kakao_analysis_${roomId}`, JSON.stringify(analysisData))
      }

      // 인사이트 히스토리 저장 (로그인 시에만)
      if (user && data.insights && data.insights.length > 0) {
        // resources를 문자열 배열로 변환 (Firestore 저장용)
        const resourceUrls = (data.resources || []).map(r =>
          typeof r === 'string' ? r : r.url
        )
        const savedHistory = await firestore.saveInsightHistory(
          user.uid,
          roomId,
          data.insights as firestore.Insight[],
          data.summary || '',
          resourceUrls,
          messagesToAnalyze.length
        )
        setInsightHistory(prev => [savedHistory, ...prev])
        // 전체 인사이트 새로고침 (Firestore에서)
        const updated = await firestore.getAllInsights(user.uid, roomId)
        setAllInsights(updated.insights)
      }
      // 분석 완료 후 업로드된 메시지 클리어
      setNewMessages([])
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // 축적된 메시지 및 인사이트 삭제
  const handleClearMessages = async () => {
    if (!user) return
    if (!isOnline) {
      alert('오프라인 상태에서는 삭제할 수 없습니다. 인터넷 연결을 확인해주세요.')
      return
    }
    try {
      await firestore.deleteChatMessages(user.uid, roomId)
      await firestore.deleteInsightHistory(user.uid, roomId)
      setAccumulatedData(null)
      setInsightHistory([])
      setAllInsights([])
      setResult(null)
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear messages:', error)
    }
  }

  // 인사이트 내보내기
  const handleExport = () => {
    const insights = categoryFilter === 'all'
      ? allInsights
      : allInsights.filter(i => i.category === categoryFilter)

    const markdown = `# ${room?.room_name} 인사이트 모음

생성일: ${new Date().toLocaleDateString()}
총 인사이트: ${insights.length}개

${insights.map(i => `## ${getCategoryEmoji(i.category)} ${i.title}

${i.content}

태그: ${i.tags.join(', ')}

---`).join('\n\n')}
`
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${room?.room_name || 'insights'}_${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 카테고리 아이콘
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'command': return '⌨️'
      case 'number': return '🔢'
      case 'solution': return '💡'
      case 'tool': return '🔧'
      case 'trend': return '📈'
      case 'business': return '💰'
      // 이전 카테고리 호환
      case 'tech': return '💡'
      case 'resource': return '📚'
      case 'tip': return '⚡'
      default: return '💡'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'command': return '명령어'
      case 'number': return '수치'
      case 'solution': return '해결'
      case 'tool': return '도구'
      case 'trend': return '트렌드'
      case 'business': return '비즈니스'
      // 이전 카테고리 호환
      case 'tech': return '기술'
      case 'resource': return '자료'
      case 'tip': return '팁'
      default: return category
    }
  }

  // 필터링된 인사이트
  const filteredInsights = categoryFilter === 'all'
    ? allInsights
    : allInsights.filter(i => i.category === categoryFilter)

  // 카테고리별 개수
  const categoryCounts = {
    all: allInsights.length,
    command: allInsights.filter(i => i.category === 'command').length,
    number: allInsights.filter(i => i.category === 'number').length,
    solution: allInsights.filter(i => i.category === 'solution').length,
    tool: allInsights.filter(i => i.category === 'tool').length,
    trend: allInsights.filter(i => i.category === 'trend').length,
    business: allInsights.filter(i => i.category === 'business').length,
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">방을 찾을 수 없습니다</p>
      </div>
    )
  }

  const totalMessages = (accumulatedData?.totalCount || 0) + newMessages.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{room.room_name}</h1>
          <p className="text-gray-600">CSV 파일을 업로드하여 인사이트를 추출하세요</p>
        </div>
      </div>

      {/* 오프라인 상태 배너 */}
      {!isOnline && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-3 text-yellow-800">
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-medium">오프라인 상태입니다</p>
                <p className="text-sm text-yellow-700">인터넷 연결을 확인해주세요. 연결되면 자동으로 데이터를 불러옵니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 축적된 데이터 상태 */}
      {accumulatedData && accumulatedData.totalCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    축적된 메시지: {accumulatedData.totalCount.toLocaleString()}개
                  </p>
                  <p className="text-sm text-blue-700">
                    {accumulatedData.firstDate && accumulatedData.lastDate && (
                      <>기간: {new Date(accumulatedData.firstDate).toLocaleDateString()} ~ {new Date(accumulatedData.lastDate).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showClearConfirm ? (
                  <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(true)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-1" />
                    초기화
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">전체 삭제?</span>
                    <Button variant="destructive" size="sm" onClick={handleClearMessages}>삭제</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>취소</Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 파일 업로드 영역 */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-1">CSV 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-sm text-gray-400">새 파일은 기존 메시지와 병합됩니다 (중복 제거)</p>
            </label>
          </div>

          {/* 새로 업로드된 메시지 */}
          {newMessages.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <FileText className="w-4 h-4" />
                <span>새로 업로드: {newMessages.length.toLocaleString()}개 메시지</span>
              </div>
            </div>
          )}

          {/* 분석 버튼 */}
          {(totalMessages > 0) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                분석 대상: <span className="font-medium">{totalMessages.toLocaleString()}개</span> 메시지
                {totalMessages > 500 && (
                  <Badge variant="secondary" className="ml-2">청크 분석</Badge>
                )}
              </div>
              <Button onClick={handleAnalyze} disabled={analyzing || totalMessages === 0}>
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    인사이트 추출 중...
                  </>
                ) : (
                  '인사이트 추출하기'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최신 분석 요약 */}
      {result && result.summary && (
        <Card className="bg-gray-50">
          <CardContent className="py-4">
            <p className="text-sm text-gray-700">{result.summary}</p>
            {result._meta?.totalMessages && (
              <p className="text-xs text-gray-500 mt-2">
                {result._meta.totalMessages.toLocaleString()}개 메시지에서 {result.insights?.length || 0}개 인사이트 추출
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 인사이트 모음 */}
      {allInsights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">인사이트 모음</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                내보내기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['all', 'command', 'number', 'solution', 'tool', 'trend', 'business'] as const).map(cat => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="gap-1"
                >
                  {cat === 'all' && '전체'}
                  {cat === 'command' && '⌨️ 명령어'}
                  {cat === 'number' && '🔢 수치'}
                  {cat === 'solution' && '💡 해결'}
                  {cat === 'tool' && '🔧 도구'}
                  {cat === 'trend' && '📈 트렌드'}
                  {cat === 'business' && '💰 비즈니스'}
                  <span className="text-xs opacity-70">({categoryCounts[cat] || 0})</span>
                </Button>
              ))}
            </div>

            {/* 인사이트 목록 */}
            <div className="space-y-3">
              {filteredInsights.map((insight, idx) => {
                const isExpanded = expandedInsights.has(idx)
                const hasSourceQuotes = insight.sourceQuotes && insight.sourceQuotes.length > 0
                return (
                  <div
                    key={idx}
                    className={`p-4 bg-white border rounded-lg transition-all ${hasSourceQuotes ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-sm'}`}
                    onClick={() => hasSourceQuotes && toggleInsight(idx)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getCategoryEmoji(insight.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                            {getCategoryLabel(insight.category)}
                          </span>
                          <h3 className="font-medium text-gray-900">{insight.title}</h3>
                          {hasSourceQuotes && (
                            <span className="text-xs text-gray-400 ml-auto">
                              {isExpanded ? '▲ 접기' : '▼ 원문 보기'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{insight.content}</p>
                        {insight.tags && insight.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {insight.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* 원본 대화 인용 (펼쳤을 때만) */}
                        {isExpanded && hasSourceQuotes && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-2">💬 원본 대화</p>
                            <div className="space-y-1">
                              {insight.sourceQuotes!.map((quote, qi) => (
                                <p key={qi} className="text-xs text-gray-500 bg-gray-50 p-2 rounded italic">
                                  &ldquo;{quote}&rdquo;
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredInsights.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  해당 카테고리에 인사이트가 없습니다
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공유된 자료 */}
      {result?.resources && result.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-500" />
              공유된 자료 ({result.resources.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.resources.map((resource, idx) => {
                // 문자열 또는 객체 형식 모두 지원
                const url = typeof resource === 'string' ? resource : resource.url
                const title = typeof resource === 'object' ? resource.title : null
                const description = typeof resource === 'object' ? resource.description : null

                if (!url) return null

                return (
                  <li key={idx} className="text-sm border-b pb-2 last:border-0">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all font-medium">
                      {title || url}
                    </a>
                    {description && (
                      <p className="text-gray-600 mt-1">{description}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 분석 히스토리 */}
      {insightHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">분석 히스토리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insightHistory.map((h, i) => (
                <div key={h.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{new Date(h.analyzedAt).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500">
                      {h.messageCount.toLocaleString()}개 메시지 → {h.insights.length}개 신규 인사이트
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 인사이트 없음 안내 */}
      {allInsights.length === 0 && !analyzing && accumulatedData && (
        <Card className="bg-gray-50">
          <CardContent className="py-8 text-center">
            <Lightbulb className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">아직 추출된 인사이트가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">위의 &quot;인사이트 추출하기&quot; 버튼을 클릭하세요</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
