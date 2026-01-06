'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, FileText, Loader2, Copy, Check, Lightbulb, MessageSquare } from 'lucide-react'
import { parseKakaoCsv, messagesToText, ChatMessage } from '@/lib/csv-parser'
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
  insights: {
    title: string
    description: string
    relatedLinks?: string[]
  }[]
  recommendations: {
    type: string
    context: string
    suggestion: string
    sampleMessage?: string
  }[]
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { user } = useAuth()
  const [history, setHistory] = useState<AnalysisHistory[]>([])
  const [selectedHistory, setSelectedHistory] = useState<AnalysisHistory | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const rooms = JSON.parse(saved)
      const found = rooms.find((r: Room) => r.id === roomId)
      if (found) setRoom(found)
    }
  }, [roomId])

  useEffect(() => {
    if (user && roomId) {
      firestore.getAnalysisHistory(user.uid, roomId).then(h => setHistory(h as AnalysisHistory[]))
    }
  }, [user, roomId])

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const parsed = parseKakaoCsv(content)
      setMessages(parsed)
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

  const handleAnalyze = async () => {
    if (messages.length === 0) return
    setAnalyzing(true)
    try {
      const text = messagesToText(messages)
      const res = await fetch('/api/summarize-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatContent: text, roomName: room?.room_name })
      })
      const data = await res.json()
      setResult(data)

      // 분석 후 히스토리 저장
      const newHistory = {
        analyzedAt: new Date().toISOString(),
        messageCount: messages.length,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{room.room_name}</h1>
          <p className="text-gray-600">CSV 파일을 업로드하여 대화를 분석하세요</p>
        </div>
      </div>

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
                  <p className="text-xs text-gray-500">{h.messageCount}개 메시지</p>
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
              <p className="text-sm text-gray-400">카카오톡 대화 내보내기 파일 (.csv, .txt)</p>
            </label>
          </div>

          {messages.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{messages.length}개 메시지 로드됨 (시스템 메시지 제외)</span>
              </div>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  '분석하기'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      {result && (
        <div className="space-y-4">
          {/* 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                대화 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="text-gray-500">기간:</span> {result.summary.period}</p>
              <p><span className="text-gray-500">메시지:</span> {result.summary.messageCount}개</p>
              <p><span className="text-gray-500">활발한 참여자:</span> {result.summary.activeUsers?.join(', ')}</p>
              <p><span className="text-gray-500">주요 토픽:</span> {result.summary.mainTopics?.join(', ')}</p>
            </CardContent>
          </Card>

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
                  <div key={idx} className="border-l-2 border-yellow-400 pl-4">
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
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
