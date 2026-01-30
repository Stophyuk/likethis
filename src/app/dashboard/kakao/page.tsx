'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Upload, FileText, Loader2, Trash2, Download, Lightbulb,
  CheckCircle2, XCircle, File, PenTool, Rocket, GraduationCap,
  Users, Sparkles, ChevronRight, History
} from 'lucide-react'
import { parseKakaoCsv, filterForAnalysis, ChatMessage } from '@/lib/csv-parser'
import { useAuth } from '@/hooks/useAuth'
import * as firestore from '@/lib/firebase/firestore'
import type { TopicSuggestion } from '@/types'
import { TopicSuggestionsModal } from '@/components/kakao/TopicSuggestionsModal'
import Link from 'next/link'

// Parse room name from Kakao CSV filename
// Format: KakaoTalk_Chat_[roomName]_[datetime] or KakaoTalkChats_[roomName].csv
function parseRoomNameFromFilename(filename: string): string {
  // Remove extension
  const name = filename.replace(/\.(csv|txt)$/i, '')

  // Try format: KakaoTalk_Chat_[roomName]_[datetime]
  const chatMatch = name.match(/^KakaoTalk_Chat_(.+?)_\d{4}-\d{2}-\d{2}/)
  if (chatMatch) return chatMatch[1]

  // Try format: KakaoTalkChats_[roomName]
  const chatsMatch = name.match(/^KakaoTalkChats_(.+)$/)
  if (chatsMatch) return chatsMatch[1]

  // Fallback: use filename without extension
  return name
}

// Insight types
interface InsightItem {
  category: 'command' | 'number' | 'solution' | 'tool' | 'trend' | 'business' | 'tech' | 'resource' | 'tip'
  title: string
  content: string
  tags: string[]
  sourceQuotes?: string[]
  extractedAt?: string
  roomName?: string
}

interface ActionableItem {
  type: 'blog' | 'project' | 'learning' | 'networking'
  title: string
  description: string
  relatedInsightTitles: string[]
}

interface AnalysisResult {
  insights: InsightItem[]
  summary: string
  resources: (string | { url: string; title?: string; description?: string })[]
  actionable?: ActionableItem[]
  noInsights?: boolean
  _meta?: {
    totalMessages: number
    chunksAnalyzed?: number
    analysisMethod: string
  }
}

// Multi-file upload state
interface FileUploadState {
  file: File
  status: 'pending' | 'parsing' | 'done' | 'error'
  messages: ChatMessage[]
  roomName: string
  error?: string
}

type CategoryFilter = 'all' | 'command' | 'number' | 'solution' | 'tool' | 'trend' | 'business'

export default function KakaoInsightPage() {
  const { user } = useAuth()

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState[]>([])
  const [newMessages, setNewMessages] = useState<ChatMessage[]>([])
  const [dragOver, setDragOver] = useState(false)

  // Analysis states
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [allInsights, setAllInsights] = useState<InsightItem[]>([])
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [roomFilter, setRoomFilter] = useState<string>('all')
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set())

  // AI 글감 states
  const [generating, setGenerating] = useState(false)
  const [showTopicsModal, setShowTopicsModal] = useState(false)
  const [generatedTopics, setGeneratedTopics] = useState<TopicSuggestion[]>([])
  const [insightSummary, setInsightSummary] = useState('')
  const [topicHistoryCount, setTopicHistoryCount] = useState(0)

  // Load topic history count
  useEffect(() => {
    const loadTopicCount = async () => {
      if (!user) return
      try {
        const historyList = await firestore.getTopicHistoryList(user.uid, 100)
        setTopicHistoryCount(historyList.length)
      } catch (error) {
        console.error('Failed to load topic count:', error)
      }
    }
    loadTopicCount()
  }, [user])

  // Load saved insights from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('likethis_kakao_insights')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setAllInsights(data.insights || [])
      } catch (e) {
        console.error('Failed to load saved insights:', e)
      }
    }
  }, [])

  // Parse a single file
  const parseFile = useCallback((file: File): Promise<ChatMessage[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsed = parseKakaoCsv(content)
          resolve(parsed)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다'))
      reader.readAsText(file, 'UTF-8')
    })
  }, [])

  // Handle multiple file uploads
  const handleFilesUpload = useCallback(async (files: File[]) => {
    const validFiles = files.filter(f => f.name.endsWith('.csv') || f.name.endsWith('.txt'))
    if (validFiles.length === 0) return

    const initialStates: FileUploadState[] = validFiles.map(file => ({
      file,
      status: 'pending',
      messages: [],
      roomName: parseRoomNameFromFilename(file.name)
    }))
    setUploadedFiles(prev => [...prev, ...initialStates])
    setResult(null)

    const startIdx = uploadedFiles.length
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const fileIdx = startIdx + i

      setUploadedFiles(prev => prev.map((f, idx) =>
        idx === fileIdx ? { ...f, status: 'parsing' } : f
      ))

      try {
        const messages = await parseFile(file)
        setUploadedFiles(prev => prev.map((f, idx) =>
          idx === fileIdx ? { ...f, status: 'done', messages } : f
        ))
      } catch (err) {
        setUploadedFiles(prev => prev.map((f, idx) =>
          idx === fileIdx ? { ...f, status: 'error', error: err instanceof Error ? err.message : '파싱 실패' } : f
        ))
      }
    }
  }, [uploadedFiles.length, parseFile])

  // Merge all uploaded messages (deduplicated)
  useEffect(() => {
    const allMessages = uploadedFiles
      .filter(f => f.status === 'done')
      .flatMap(f => f.messages)

    const seen = new Set<string>()
    const unique = allMessages.filter(m => {
      const key = `${m.date}_${m.user}_${m.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setNewMessages(unique)
  }, [uploadedFiles])

  // Remove a file
  const removeFile = useCallback((idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }, [])

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setUploadedFiles([])
    setNewMessages([])
  }, [])

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFilesUpload(files)
  }, [handleFilesUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) handleFilesUpload(files)
    e.target.value = ''
  }, [handleFilesUpload])

  // Run analysis - chunked upload for large files
  const handleAnalyze = async () => {
    const filesToAnalyze = uploadedFiles.filter(f => f.status === 'done' && f.messages.length > 0)
    if (filesToAnalyze.length === 0) return

    setAnalyzing(true)
    try {
      const allNewInsights: InsightItem[] = []
      let lastResult: AnalysisResult | null = null

      // Process each file
      for (const fileState of filesToAnalyze) {
        const filteredMessages = filterForAnalysis(fileState.messages)
        console.log(`[${fileState.roomName}] Filtered: ${fileState.messages.length} → ${filteredMessages.length}`)

        if (filteredMessages.length === 0) continue

        // Split large message sets into chunks for upload (10,000 messages per request max)
        const UPLOAD_CHUNK_SIZE = 10000
        const uploadChunks: ChatMessage[][] = []
        for (let i = 0; i < filteredMessages.length; i += UPLOAD_CHUNK_SIZE) {
          uploadChunks.push(filteredMessages.slice(i, i + UPLOAD_CHUNK_SIZE))
        }

        console.log(`[${fileState.roomName}] Split into ${uploadChunks.length} upload chunks`)

        // Process each upload chunk
        for (let chunkIdx = 0; chunkIdx < uploadChunks.length; chunkIdx++) {
          const chunk = uploadChunks[chunkIdx]
          const chunkName = uploadChunks.length > 1
            ? `${fileState.roomName} (${chunkIdx + 1}/${uploadChunks.length})`
            : fileState.roomName

          console.log(`[${chunkName}] Sending ${chunk.length} messages...`)

          const res = await fetch('/api/summarize-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: chunk,
              roomName: fileState.roomName
            })
          })

          if (!res.ok) {
            console.error(`[${chunkName}] API error: ${res.status}`)
            continue
          }

          const data = await res.json() as AnalysisResult
          lastResult = data

          if (data.insights && data.insights.length > 0) {
            const insightsWithRoom = data.insights.map(insight => ({
              ...insight,
              roomName: fileState.roomName
            }))
            allNewInsights.push(...insightsWithRoom)
            console.log(`[${chunkName}] Got ${data.insights.length} insights`)
          }

          // Small delay between chunks
          if (chunkIdx < uploadChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }

      setResult(lastResult)

      if (allNewInsights.length > 0) {
        // Deduplicate by title + roomName
        const uniqueNewInsights: InsightItem[] = []
        const seenKeys = new Set<string>()
        for (const insight of allNewInsights) {
          const key = `${insight.roomName}:${insight.title}`
          if (!seenKeys.has(key)) {
            seenKeys.add(key)
            uniqueNewInsights.push(insight)
          }
        }

        // Merge with existing insights
        const existingKeys = new Set(allInsights.map(i => `${i.roomName}:${i.title}`))
        const newInsights = uniqueNewInsights.filter(i => !existingKeys.has(`${i.roomName}:${i.title}`))
        const merged = [...newInsights, ...allInsights]
        setAllInsights(merged)

        // Save to localStorage
        localStorage.setItem('likethis_kakao_insights', JSON.stringify({
          insights: merged,
          summary: lastResult?.summary || '',
          updatedAt: new Date().toISOString(),
        }))

        // Also save for content factory
        localStorage.setItem('likethis_latest_kakao_analysis', JSON.stringify({
          insights: merged,
          summary: lastResult?.summary || '',
          analyzedAt: new Date().toISOString(),
        }))

        console.log(`Total: ${uniqueNewInsights.length} new insights, ${merged.length} total`)
      }

      // Clear uploaded files after analysis
      setUploadedFiles([])
      setNewMessages([])
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('분석에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Generate AI topics
  const handleGenerateTopics = async () => {
    if (allInsights.length === 0) return

    setGenerating(true)
    try {
      // Build room names mapping from insights
      const roomNamesMap: Record<string, string> = {}
      allInsights.forEach(i => {
        if (i.roomName) {
          roomNamesMap[i.roomName] = i.roomName
        }
      })

      const response = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights: allInsights.map(i => ({
            ...i,
            roomId: i.roomName || 'kakao',
            roomName: i.roomName || '카카오톡 대화'
          })),
          roomNames: Object.keys(roomNamesMap).length > 0 ? roomNamesMap : { 'kakao': '카카오톡 대화' },
          interests: [],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '글감 생성에 실패했습니다.')
      }

      const data = await response.json()
      setGeneratedTopics(data.topics)
      setInsightSummary(data.insightSummary)
      setShowTopicsModal(true)
    } catch (error) {
      console.error('Failed to generate topics:', error)
      alert(error instanceof Error ? error.message : '글감 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  // Save topics
  const handleSaveTopics = async () => {
    if (!user || generatedTopics.length === 0) return

    try {
      // Get unique room names from insights
      const roomNames = uniqueRooms.length > 0 ? uniqueRooms : ['카카오톡 대화']

      await firestore.saveTopicHistory(
        user.uid,
        generatedTopics,
        insightSummary,
        allInsights.length,
        roomNames
      )
      setShowTopicsModal(false)
      setTopicHistoryCount(prev => prev + 1)
    } catch (error) {
      console.error('Failed to save topics:', error)
      alert('저장에 실패했습니다.')
    }
  }

  // Clear all insights
  const handleClearInsights = () => {
    if (confirm('모든 인사이트를 삭제하시겠습니까?')) {
      setAllInsights([])
      setResult(null)
      localStorage.removeItem('likethis_kakao_insights')
      localStorage.removeItem('likethis_latest_kakao_analysis')
    }
  }

  // Export insights
  const handleExport = () => {
    const insights = categoryFilter === 'all'
      ? allInsights
      : allInsights.filter(i => i.category === categoryFilter)

    const markdown = `# 카카오톡 인사이트 모음

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
    a.download = `kakao_insights_${new Date().toISOString().split('T')[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Helper functions
  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      command: '⌨️', number: '🔢', solution: '💡', tool: '🔧',
      trend: '📈', business: '💰', tech: '💡', resource: '📚', tip: '⚡'
    }
    return map[category] || '💡'
  }

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      command: '명령어', number: '수치', solution: '해결', tool: '도구',
      trend: '트렌드', business: '비즈니스', tech: '기술', resource: '자료', tip: '팁'
    }
    return map[category] || category
  }

  const toggleInsight = (idx: number) => {
    setExpandedInsights(prev => {
      const newSet = new Set(prev)
      if (newSet.has(idx)) newSet.delete(idx)
      else newSet.add(idx)
      return newSet
    })
  }

  // Get unique room names for filter
  const uniqueRooms = Array.from(new Set(allInsights.map(i => i.roomName).filter(Boolean))) as string[]

  // Apply both room and category filters
  const filteredInsights = allInsights.filter(i => {
    const matchRoom = roomFilter === 'all' || i.roomName === roomFilter
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter
    return matchRoom && matchCategory
  })

  // Count by category (with room filter applied)
  const roomFilteredInsights = roomFilter === 'all'
    ? allInsights
    : allInsights.filter(i => i.roomName === roomFilter)

  const categoryCounts = {
    all: roomFilteredInsights.length,
    command: roomFilteredInsights.filter(i => i.category === 'command').length,
    number: roomFilteredInsights.filter(i => i.category === 'number').length,
    solution: roomFilteredInsights.filter(i => i.category === 'solution').length,
    tool: roomFilteredInsights.filter(i => i.category === 'tool').length,
    trend: roomFilteredInsights.filter(i => i.category === 'trend').length,
    business: roomFilteredInsights.filter(i => i.category === 'business').length,
  }

  // Count by room
  const roomCounts: Record<string, number> = { all: allInsights.length }
  uniqueRooms.forEach(room => {
    roomCounts[room] = allInsights.filter(i => i.roomName === room).length
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">카카오 인사이트</h1>
          <p className="text-gray-600 mt-1">
            오픈채팅방 대화에서 핵심 정보를 추출하고 글감으로 활용하세요
          </p>
        </div>
        <Button
          onClick={handleGenerateTopics}
          disabled={generating || allInsights.length === 0}
          className={allInsights.length > 0 ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''}
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {generating ? '생성 중...' : 'AI 글감 만들기'}
        </Button>
      </div>

      {/* Section 1: CSV Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            CSV 업로드
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              multiple
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-1">CSV 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-sm text-gray-400">여러 파일을 동시에 업로드할 수 있습니다</p>
            </label>
          </div>

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  업로드된 파일 ({uploadedFiles.length}개)
                </span>
                <Button variant="ghost" size="sm" onClick={clearAllFiles} className="text-red-600 hover:text-red-700 h-7">
                  <Trash2 className="w-3 h-3 mr-1" />
                  전체 삭제
                </Button>
              </div>
              {uploadedFiles.map((fileState, idx) => (
                <div
                  key={`${fileState.file.name}-${idx}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    fileState.status === 'done' ? 'bg-green-50 border-green-200' :
                    fileState.status === 'error' ? 'bg-red-50 border-red-200' :
                    fileState.status === 'parsing' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {fileState.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    {fileState.status === 'error' && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    {fileState.status === 'parsing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
                    {fileState.status === 'pending' && <File className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{fileState.roomName}</p>
                        {fileState.status === 'done' && (() => {
                          const filtered = filterForAnalysis(fileState.messages)
                          const removed = fileState.messages.length - filtered.length
                          return (
                            <span className="text-xs text-gray-400">
                              {filtered.length.toLocaleString()}개
                              {removed > 0 && <span className="text-green-600 ml-1">(-{removed} 필터)</span>}
                            </span>
                          )
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {fileState.status === 'done' && fileState.file.name}
                        {fileState.status === 'parsing' && '파싱 중...'}
                        {fileState.status === 'pending' && '대기 중'}
                        {fileState.status === 'error' && (fileState.error || '파싱 실패')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} className="h-7 w-7 p-0 text-gray-400 hover:text-red-600">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Message summary and analyze button */}
          {newMessages.length > 0 && (() => {
            const totalOriginal = uploadedFiles.filter(f => f.status === 'done').reduce((sum, f) => sum + f.messages.length, 0)
            const totalFiltered = uploadedFiles.filter(f => f.status === 'done').reduce((sum, f) => sum + filterForAnalysis(f.messages).length, 0)
            const removed = totalOriginal - totalFiltered
            return (
              <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <FileText className="w-4 h-4" />
                  <span>
                    분석 대상: {totalFiltered.toLocaleString()}개 메시지
                    {removed > 0 && (
                      <span className="text-gray-500 ml-1">(원본 {totalOriginal.toLocaleString()}개, 노이즈 {removed.toLocaleString()}개 제거)</span>
                    )}
                  </span>
                </div>
                <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      추출 중...
                    </>
                  ) : (
                    '인사이트 추출'
                  )}
                </Button>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Section 2: Insights List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              추출된 인사이트
              {allInsights.length > 0 && (
                <Badge variant="secondary">{allInsights.length}개</Badge>
              )}
            </CardTitle>
            {allInsights.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1" />
                  내보내기
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearInsights} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-1" />
                  초기화
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allInsights.length === 0 ? (
            <div className="py-12 text-center">
              <Lightbulb className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">아직 추출된 인사이트가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">CSV 파일을 업로드하고 인사이트를 추출해보세요</p>
            </div>
          ) : (
            <>
              {/* Room filter */}
              {uniqueRooms.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">채팅방</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={roomFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoomFilter('all')}
                      className="gap-1"
                    >
                      💬 전체 <span className="text-xs opacity-70">({roomCounts.all})</span>
                    </Button>
                    {uniqueRooms.map(room => (
                      <Button
                        key={room}
                        variant={roomFilter === room ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRoomFilter(room)}
                        className="gap-1"
                      >
                        {room} <span className="text-xs opacity-70">({roomCounts[room] || 0})</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category filter */}
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

              {/* Insights list */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                              {getCategoryLabel(insight.category)}
                            </span>
                            {insight.roomName && roomFilter === 'all' && (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                💬 {insight.roomName}
                              </span>
                            )}
                            <h3 className="font-medium text-gray-900">{insight.title}</h3>
                            {hasSourceQuotes && (
                              <span className="text-xs text-gray-400 ml-auto">
                                {isExpanded ? '▲ 접기' : '▼ 원문'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{insight.content}</p>
                          {insight.tags && insight.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {insight.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                              ))}
                            </div>
                          )}
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: AI Writing Topics */}
      <Card className="border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI 글감
              {topicHistoryCount > 0 && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">{topicHistoryCount}개 생성됨</Badge>
              )}
            </CardTitle>
            {topicHistoryCount > 0 && (
              <Link href="/dashboard/kakao/topics">
                <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                  <History className="w-4 h-4 mr-1" />
                  히스토리 보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allInsights.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">인사이트를 먼저 추출해주세요</p>
              <p className="text-sm text-gray-400 mt-1">인사이트를 바탕으로 AI가 글감을 제안합니다</p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full text-purple-700 mb-4">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium">{allInsights.length}개 인사이트로 글감 생성 가능</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                추출된 인사이트를 분석하여 블로그, 프로젝트, 학습, 네트워킹 아이디어를 제안받으세요
              </p>
              <Button
                onClick={handleGenerateTopics}
                disabled={generating}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {generating ? '생성 중...' : 'AI 글감 만들기'}
              </Button>
            </div>
          )}

          {/* Actionable suggestions from latest analysis */}
          {result?.actionable && result.actionable.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-3">최근 분석에서 도출된 활용 제안</p>
              <div className="grid md:grid-cols-2 gap-3">
                {result.actionable.map((action, idx) => {
                  const typeConfig = {
                    blog: { icon: PenTool, label: '블로그/SNS', color: 'text-blue-600 bg-blue-100' },
                    project: { icon: Rocket, label: '프로젝트', color: 'text-green-600 bg-green-100' },
                    learning: { icon: GraduationCap, label: '학습', color: 'text-orange-600 bg-orange-100' },
                    networking: { icon: Users, label: '네트워킹', color: 'text-purple-600 bg-purple-100' },
                  }[action.type] || { icon: Lightbulb, label: '제안', color: 'text-gray-600 bg-gray-100' }

                  const Icon = typeConfig.icon
                  return (
                    <div key={idx} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded ${typeConfig.color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                          <h4 className="font-medium text-sm text-gray-900 mt-1">{action.title}</h4>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Topics Modal */}
      <TopicSuggestionsModal
        isOpen={showTopicsModal}
        onClose={() => setShowTopicsModal(false)}
        topics={generatedTopics}
        insightSummary={insightSummary}
        onSave={handleSaveTopics}
      />
    </div>
  )
}
