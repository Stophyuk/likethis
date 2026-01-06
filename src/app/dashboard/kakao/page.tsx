'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, MessageCircle, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'likethis_kakao_rooms'

interface Room {
  id: string
  room_name: string
  description: string
  created_at: string
}

function loadRooms(): Room[] {
  if (typeof window === 'undefined') return []
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return JSON.parse(saved)
  return [
    { id: '1', room_name: '1인개발 마스터', description: '1인개발자 네트워킹', created_at: new Date().toISOString() },
    { id: '2', room_name: 'AI 개발자 모임', description: 'AI/ML 관련 정보 공유', created_at: new Date().toISOString() },
  ]
}

function saveRooms(rooms: Room[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
}

export default function KakaoPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [mounted, setMounted] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    setMounted(true)
    setRooms(loadRooms())
  }, [])

  const handleAddRoom = () => {
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
  }

  const handleDeleteRoom = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = rooms.filter(r => r.id !== id)
    setRooms(updated)
    saveRooms(updated)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">카톡방 취합</h1>
          <p className="text-gray-600 mt-2">
            오픈채팅방 대화를 요약하고 핵심 정보를 추출하세요
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          방 추가
        </Button>
      </div>

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
    </div>
  )
}
