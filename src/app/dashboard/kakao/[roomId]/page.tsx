'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileText, Loader2, Copy, Check, Lightbulb, MessageSquare, Database, Trash2, AlertCircle, Link2, Clock } from 'lucide-react'
import { parseKakaoCsv, ChatMessage } from '@/lib/csv-parser'
import { useAuth } from '@/hooks/useAuth'
import * as firestore from '@/lib/firebase/firestore'

const STORAGE_KEY = 'likethis_kakao_rooms'

interface Room {
  id: string
  room_name: string
  description: string
}

interface AnalysisResult {
  summary: {
    period: string
    messageCount: number
    activeUsers: string[]
    mainTopics: string[]
  }
  recentAnalysis?: {
    period: string
    details: string
  }
  previousSummary?: {
    period: string
    briefSummary: string
  }
  insights: {
    title: string
    description: string
    importance?: string
    source?: string
    relatedLinks?: string[]
  }[]
  recommendations: {
    type: string
    context: string
    suggestion: string
    sampleMessage?: string
  }[]
  keyDecisions?: string[]
  pendingItems?: string[]
  sharedResources?: string[]
  _meta?: {
    totalMessages: number
    chunksAnalyzed: number
    analysisMethod: string
  }
}

interface AnalysisHistory {
  id: string
  analyzedAt: string
  messageCount: number
  result: AnalysisResult
}

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { user } = useAuth()
  const [history, setHistory] = useState<AnalysisHistory[]>([])
  const [selectedHistory, setSelectedHistory] = useState<AnalysisHistory | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // 방 정보 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const rooms = JSON.parse(saved)
      const found = rooms.find((r: Room) => r.id === roomId)
      if (found) setRoom(found)
    }
  }, [roomId])

  // 축적된 메시지 및 히스토리 로드
  useEffect(() => {
    if (user && roomId) {
      firestore.getChatMessages(user.uid, roomId).then(data => {
        if (data.totalCount > 0) {
          setAccumulatedData(data)
        }
      })
      firestore.getAnalysisHistory(user.uid, roomId).then(h => setHistory(h as AnalysisHistory[]))
    }
  }, [user, roomId])

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const parsed = parseKakaoCsv(content)
      setNewMessages(parsed)
      setResult(null)
      setSelectedHistory(null)
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
    setSaving(true)
    try {
      const updated = await firestore.saveChatMessages(user.uid, roomId, newMessages)
      setAccumulatedData(updated)
      setNewMessages([]) // 업로드된 메시지 초기화
    } catch (error) {
      console.error('Failed to save messages:', error)
    } finally {
      setSaving(false)
    }
  }

  // 분석 실행
  const handleAnalyze = async () => {
    // 분석할 메시지 결정: 새 메시지가 있으면 축적 후 분석, 없으면 축적된 메시지로 분석
    let messagesToAnalyze: ChatMessage[] = []

    if (newMessages.length > 0 && user) {
      // 새 메시지를 먼저 축적
      setSaving(true)
      try {
        const updated = await firestore.saveChatMessages(user.uid, roomId, newMessages)
        setAccumulatedData(updated)
        messagesToAnalyze = updated.messages
        setNewMessages([])
      } catch (error) {
        console.error('Failed to save messages:', error)
        return
      } finally {
        setSaving(false)
      }
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
      const data = await res.json()
      setResult(data)

      // 분석 후 히스토리 저장
      const newHistory = {
        analyzedAt: new Date().toISOString(),
        messageCount: messagesToAnalyze.length,
        result: data
      }
      if (user) {
        await firestore.saveAnalysisHistory(user.uid, roomId, newHistory)
        setHistory(prev => [newHistory as AnalysisHistory, ...prev])
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // 축적된 메시지 삭제
  const handleClearMessages = async () => {
    if (!user) return
    try {
      await firestore.deleteChatMessages(user.uid, roomId)
      setAccumulatedData(null)
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear messages:', error)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
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
          <p className="text-gray-600">CSV 파일을 업로드하여 대화를 축적하고 분석하세요</p>
        </div>
      </div>

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
                    <span className="text-sm text-red-600">정말 삭제?</span>
                    <Button variant="destructive" size="sm" onClick={handleClearMessages}>삭제</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>취소</Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 히스토리 */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">분석 히스토리</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((h, i) => (
                <button
                  key={h.id || i}
                  onClick={() => { setSelectedHistory(h); setResult(h.result) }}
                  className={`flex-shrink-0 p-3 rounded-lg border text-left ${selectedHistory?.id === h.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <p className="font-medium text-sm">{new Date(h.analyzedAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{h.messageCount.toLocaleString()}개 메시지</p>
                </button>
              ))}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <FileText className="w-4 h-4" />
                  <span>새로 업로드: {newMessages.length.toLocaleString()}개 메시지</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveMessages} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 mr-1" />}
                    저장만
                  </Button>
                </div>
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
                    {totalMessages > 500 ? '청크 분석 중...' : '분석 중...'}
                  </>
                ) : (
                  '전체 분석하기'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      {result && (
        <div className="space-y-4">
          {/* 분석 메타 정보 */}
          {result._meta && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>
                {result._meta.totalMessages.toLocaleString()}개 메시지 / {result._meta.chunksAnalyzed}개 청크 분석
              </span>
            </div>
          )}

          {/* 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                대화 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><span className="text-gray-500">기간:</span> {result.summary.period}</p>
              <p><span className="text-gray-500">메시지:</span> {result.summary.messageCount?.toLocaleString()}개</p>
              <p><span className="text-gray-500">활발한 참여자:</span> {result.summary.activeUsers?.join(', ')}</p>
              <div>
                <span className="text-gray-500">주요 토픽:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {result.summary.mainTopics?.map((topic, i) => (
                    <Badge key={i} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 최근 대화 상세 */}
          {result.recentAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  최근 대화 상세
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">{result.recentAnalysis.period}</p>
                <p className="text-gray-700">{result.recentAnalysis.details}</p>
              </CardContent>
            </Card>
          )}

          {/* 이전 대화 요약 */}
          {result.previousSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  이전 대화 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">{result.previousSummary.period}</p>
                <p className="text-gray-700">{result.previousSummary.briefSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* 주요 결정사항 */}
          {result.keyDecisions && result.keyDecisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  주요 결정/합의 사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.keyDecisions.map((decision, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 미결 사항 */}
          {result.pendingItems && result.pendingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  미결 논의/질문
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.pendingItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">?</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 공유된 자료 */}
          {result.sharedResources && result.sharedResources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-500" />
                  공유된 링크/자료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.sharedResources.map((resource, idx) => (
                    <li key={idx} className="text-sm">
                      {resource.startsWith('http') ? (
                        <a href={resource} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                          {resource}
                        </a>
                      ) : (
                        <span>{resource}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 인사이트 */}
          {result.insights?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  인사이트
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.insights.map((insight, idx) => (
                  <div key={idx} className={`border-l-2 pl-4 ${insight.importance === 'high' ? 'border-red-400' : 'border-yellow-400'}`}>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{insight.title}</p>
                      {insight.importance === 'high' && (
                        <Badge variant="destructive" className="text-xs">중요</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    {insight.source && (
                      <p className="text-xs text-gray-400 mt-1">📌 {insight.source}</p>
                    )}
                    {insight.relatedLinks && insight.relatedLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {insight.relatedLinks.map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 참여 추천 */}
          {result.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  참여 추천
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {rec.type}
                      </span>
                      <span className="text-sm text-gray-600">{rec.context}</span>
                    </div>
                    <p className="text-sm mb-2">{rec.suggestion}</p>
                    {rec.sampleMessage && (
                      <div className="bg-white border rounded p-3 mt-2">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{rec.sampleMessage}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => copyToClipboard(rec.sampleMessage!, idx)}
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              복사하기
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
