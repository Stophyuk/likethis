'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, MessageCircle, Trash2, Sparkles, FileText, Loader2 } from 'lucide-react'
import { useSync } from '@/hooks/useSync'
import { useAuth } from '@/hooks/useAuth'
import { getAllRoomsInsights, getTopicHistoryList, saveTopicHistory } from '@/lib/firebase/firestore'
import type { TopicSuggestion } from '@/types'
import { TopicSuggestionsModal } from '@/components/kakao/TopicSuggestionsModal'

const STORAGE_KEY = 'likethis_kakao_rooms'

interface Room {
  id: string
  room_name: string
  description: string
  created_at: string
}

const DEFAULT_ROOMS: Room[] = [
  { id: '1', room_name: '1인개발 마스터', description: '1인개발자 네트워킹', created_at: '2024-01-01T00:00:00.000Z' },
  { id: '2', room_name: 'AI 개발자 모임', description: 'AI/ML 관련 정보 공유', created_at: '2024-01-01T00:00:00.000Z' },
]

function loadRooms(): Room[] {
  if (typeof window === 'undefined') return DEFAULT_ROOMS
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return JSON.parse(saved)
  return DEFAULT_ROOMS
}

function saveRooms(rooms: Room[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
  }
}

export default function KakaoPage() {
  const [rooms, setRooms] = useState<Room[]>(DEFAULT_ROOMS)
  const [newRoomName, setNewRoomName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const { syncKakaoRoomsNow } = useSync()
  const { user } = useAuth()

  // AI 글감 관련 상태
  const [totalInsights, setTotalInsights] = useState(0)
  const [topicHistoryCount, setTopicHistoryCount] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [showTopicsModal, setShowTopicsModal] = useState(false)
  const [generatedTopics, setGeneratedTopics] = useState<TopicSuggestion[]>([])
  const [insightSummary, setInsightSummary] = useState('')

  // 인사이트 및 히스토리 카운트 로드
  const loadCounts = useCallback(async () => {
    if (!user) return

    try {
      const [insightsData, historyList] = await Promise.all([
        getAllRoomsInsights(user.uid),
        getTopicHistoryList(user.uid, 100),
      ])
      setTotalInsights(insightsData.insights.length)
      setTopicHistoryCount(historyList.length)
    } catch (error) {
      console.error('Failed to load counts:', error)
    }
  }, [user])

  useEffect(() => {
    const savedRooms = loadRooms()
    setRooms(savedRooms)
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  // AI 글감 생성
  const handleGenerateTopics = async () => {
    if (!user || totalInsights === 0) return

    setGenerating(true)
    try {
      // 인사이트 가져오기
      const { insights } = await getAllRoomsInsights(user.uid)

      // 방 이름 매핑 생성
      const roomNames: Record<string, string> = {}
      rooms.forEach(room => {
        roomNames[room.id] = room.room_name
      })

      // API 호출
      const response = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights,
          roomNames,
          interests: [], // 추후 사용자 관심사 연동
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

  // 글감 저장
  const handleSaveTopics = async () => {
    if (!user || generatedTopics.length === 0) return

    try {
      const roomsUsed = [...new Set(generatedTopics.flatMap(t => t.relatedInsights.map(i => i.roomName)))]
      await saveTopicHistory(
        user.uid,
        generatedTopics,
        insightSummary,
        totalInsights,
        roomsUsed
      )
      setShowTopicsModal(false)
      loadCounts() // 카운트 새로고침
    } catch (error) {
      console.error('Failed to save topics:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return
    const newRoom: Room = {
      id: Date.now().toString(),
      room_name: newRoomName,
      description: '',
      created_at: new Date().toISOString(),
    }
    const updated = [...rooms, newRoom]
    setRooms(updated)
    saveRooms(updated)
    setNewRoomName('')
    setShowAddForm(false)
    // 즉시 Firestore에 동기화
    await syncKakaoRoomsNow()
  }

  const handleDeleteRoom = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = rooms.filter(r => r.id !== id)
    setRooms(updated)
    saveRooms(updated)
    // 즉시 Firestore에 동기화
    await syncKakaoRoomsNow()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">카톡방 취합</h1>
          <p className="text-gray-600 mt-2">
            오픈채팅방 대화를 요약하고 핵심 정보를 추출하세요
          </p>
          {totalInsights > 0 && (
            <p className="text-sm text-purple-600 mt-1">
              총 {totalInsights}개의 인사이트가 수집됨
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateTopics}
            disabled={generating || totalInsights === 0}
            variant={totalInsights > 0 ? 'default' : 'outline'}
            className={totalInsights > 0 ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {generating ? '생성 중...' : 'AI 글감 만들기'}
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            방 추가
          </Button>
        </div>
      </div>

      {/* 글감 히스토리 링크 카드 */}
      {topicHistoryCount > 0 && (
        <Link href="/dashboard/kakao/topics">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors cursor-pointer border-purple-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">
                    생성된 글감 {topicHistoryCount}개
                  </span>
                </div>
                <span className="text-sm text-purple-600">보러가기 →</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="방 이름 입력"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()}
              />
              <Button onClick={handleAddRoom}>추가</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Link href={`/dashboard/kakao/${room.id}`} key={room.id}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-yellow-500" />
                    {room.room_name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={(e) => handleDeleteRoom(e, room.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
                {room.description && (
                  <CardDescription>{room.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* AI 글감 모달 */}
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
