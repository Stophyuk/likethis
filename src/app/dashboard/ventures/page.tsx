'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { VentureCard, VentureForm, MonopolyMap, IdeaForm } from '@/components/ventures'
import { useAuth } from '@/hooks/useAuth'
import {
  getVentures,
  saveVenture,
  archiveVenture,
  getPersonalMonopoly,
  savePersonalMonopoly,
  getIncubatorIdeas,
  saveIncubatorIdea,
  convertIdeaToVenture,
  deleteIncubatorIdea,
} from '@/lib/firebase/firestore'
import type { Venture, VentureStatus, PersonalMonopoly, IncubatorIdea } from '@/types'

export default function VenturesPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('portfolio')

  // Portfolio state
  const [ventures, setVentures] = useState<Venture[]>([])
  const [selectedVenture, setSelectedVenture] = useState<Venture | null>(null)
  const [showVentureForm, setShowVentureForm] = useState(false)
  const [venturesLoading, setVenturesLoading] = useState(true)

  // Monopoly state
  const [monopoly, setMonopoly] = useState<PersonalMonopoly | null>(null)
  const [monopolyLoading, setMonopolyLoading] = useState(true)

  // Incubator state
  const [ideas, setIdeas] = useState<IncubatorIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<IncubatorIdea | null>(null)
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false)

  // Load ventures
  const loadVentures = useCallback(async () => {
    if (!user) return
    setVenturesLoading(true)
    try {
      const data = await getVentures(user.uid)
      setVentures(data)
    } catch (error) {
      console.error('Failed to load ventures:', error)
    } finally {
      setVenturesLoading(false)
    }
  }, [user])

  // Load monopoly
  const loadMonopoly = useCallback(async () => {
    if (!user) return
    setMonopolyLoading(true)
    try {
      const data = await getPersonalMonopoly(user.uid)
      setMonopoly(data)
    } catch (error) {
      console.error('Failed to load monopoly:', error)
    } finally {
      setMonopolyLoading(false)
    }
  }, [user])

  // Load ideas
  const loadIdeas = useCallback(async () => {
    if (!user) return
    setIdeasLoading(true)
    try {
      const data = await getIncubatorIdeas(user.uid)
      setIdeas(data)
    } catch (error) {
      console.error('Failed to load ideas:', error)
    } finally {
      setIdeasLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadVentures()
      loadMonopoly()
      loadIdeas()
    }
  }, [user, loadVentures, loadMonopoly, loadIdeas])

  // Venture handlers
  const handleSaveVenture = async (venture: Venture) => {
    if (!user) return
    try {
      await saveVenture(user.uid, venture)
      await loadVentures()
      setShowVentureForm(false)
      setSelectedVenture(null)
    } catch (error) {
      console.error('Failed to save venture:', error)
    }
  }

  const handleEditVenture = (venture: Venture) => {
    setSelectedVenture(venture)
    setShowVentureForm(true)
  }

  const handleArchiveVenture = async (venture: Venture) => {
    if (!user) return
    try {
      await archiveVenture(user.uid, venture.id)
      await loadVentures()
    } catch (error) {
      console.error('Failed to archive venture:', error)
    }
  }

  const handleStatusChange = async (venture: Venture, status: VentureStatus) => {
    if (!user) return
    try {
      await saveVenture(user.uid, { ...venture, status, updatedAt: new Date().toISOString() })
      await loadVentures()
    } catch (error) {
      console.error('Failed to change venture status:', error)
    }
  }

  // Monopoly handlers
  const handleSaveMonopoly = async (data: PersonalMonopoly) => {
    if (!user) return
    try {
      await savePersonalMonopoly(user.uid, data)
      setMonopoly(data)
    } catch (error) {
      console.error('Failed to save monopoly:', error)
    }
  }

  // Idea handlers
  const handleSaveIdea = async (idea: IncubatorIdea) => {
    if (!user) return
    try {
      await saveIncubatorIdea(user.uid, idea)
      await loadIdeas()
      // Keep editing the same idea
      setSelectedIdea(idea)
    } catch (error) {
      console.error('Failed to save idea:', error)
    }
  }

  const handleRequestFeedback = async (idea: IncubatorIdea) => {
    if (!user) return
    setIsRequestingFeedback(true)
    try {
      // Call analyze-idea API
      const response = await fetch('/api/analyze-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI feedback')
      }

      const { feedback } = await response.json()

      // Update idea with feedback
      const updatedIdea: IncubatorIdea = {
        ...idea,
        aiFeedback: {
          ...feedback,
          generatedAt: new Date().toISOString(),
        },
        stage: 'ai_feedback',
        updatedAt: new Date().toISOString(),
      }

      await saveIncubatorIdea(user.uid, updatedIdea)
      await loadIdeas()
      setSelectedIdea(updatedIdea)
    } catch (error) {
      console.error('Failed to get AI feedback:', error)
    } finally {
      setIsRequestingFeedback(false)
    }
  }

  const handleConvertToVenture = async (idea: IncubatorIdea) => {
    if (!user) return
    try {
      // Use first 50 chars of rawIdea as name, full rawIdea as description
      const name = idea.rawIdea.slice(0, 50).trim() + (idea.rawIdea.length > 50 ? '...' : '')
      const description = idea.rawIdea
      const ventureId = await convertIdeaToVenture(user.uid, idea.id, name, description)
      if (ventureId) {
        await loadVentures()
        await loadIdeas()
        setSelectedIdea(null)
        setActiveTab('portfolio')
      }
    } catch (error) {
      console.error('Failed to convert idea to venture:', error)
    }
  }

  const handleDeleteIdea = async (ideaId: string) => {
    if (!user) return
    try {
      await deleteIncubatorIdea(user.uid, ideaId)
      await loadIdeas()
      if (selectedIdea?.id === ideaId) {
        setSelectedIdea(null)
      }
    } catch (error) {
      console.error('Failed to delete idea:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  // Calculate stats
  const activeVentures = ventures.filter((v) => v.status !== 'archived' && v.status !== 'paused')
  const totalRevenue = ventures.reduce((sum, v) => sum + (v.revenue || 0), 0)
  const activeIdeas = ideas.filter((i) => i.stage !== 'converted')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventures</h1>
        <p className="text-gray-600">Personal Holding Company Dashboard</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{activeVentures.length}</div>
          <div className="text-sm text-gray-500">활성 벤처</div>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {totalRevenue > 0 ? `₩${totalRevenue.toLocaleString()}` : '-'}
          </div>
          <div className="text-sm text-gray-500">총 월 수익</div>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{activeIdeas.length}</div>
          <div className="text-sm text-gray-500">인큐베이팅 아이디어</div>
        </div>
        <div className="p-4 bg-white rounded-lg border">
          <div className="text-2xl font-bold text-amber-600">
            {monopoly ? `${Math.round(monopoly.skills.reduce((s, sk) => s + sk.level, 0) / monopoly.skills.length)}/10` : '-'}
          </div>
          <div className="text-sm text-gray-500">평균 스킬 레벨</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="monopoly">Monopoly Map</TabsTrigger>
          <TabsTrigger value="incubator">Incubator</TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          {showVentureForm ? (
            <VentureForm
              venture={selectedVenture}
              onSubmit={handleSaveVenture}
              onCancel={() => {
                setShowVentureForm(false)
                setSelectedVenture(null)
              }}
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">내 벤처들</h2>
                <Button onClick={() => setShowVentureForm(true)}>새 벤처 추가</Button>
              </div>

              {venturesLoading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : ventures.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">아직 등록된 벤처가 없습니다</p>
                  <Button onClick={() => setShowVentureForm(true)}>첫 벤처 만들기</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ventures
                    .filter((v) => v.status !== 'archived')
                    .map((venture) => (
                      <VentureCard
                        key={venture.id}
                        venture={venture}
                        onEdit={handleEditVenture}
                        onArchive={handleArchiveVenture}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                </div>
              )}

              {/* Archived Section */}
              {ventures.filter((v) => v.status === 'archived').length > 0 && (
                <div className="pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">아카이브된 벤처</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                    {ventures
                      .filter((v) => v.status === 'archived')
                      .map((venture) => (
                        <VentureCard
                          key={venture.id}
                          venture={venture}
                          onEdit={handleEditVenture}
                          onArchive={handleArchiveVenture}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Monopoly Map Tab */}
        <TabsContent value="monopoly">
          {monopolyLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <MonopolyMap monopoly={monopoly} onSave={handleSaveMonopoly} />
          )}
        </TabsContent>

        {/* Incubator Tab */}
        <TabsContent value="incubator" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Think First Incubator</h2>
              <p className="text-sm text-gray-500">
                AI 피드백 전에 스스로 깊이 고민하세요
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedIdea(null)}
              disabled={!selectedIdea}
            >
              새 아이디어
            </Button>
          </div>

          {ideasLoading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Idea List */}
              <div className="lg:col-span-1 space-y-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">아이디어 목록</h3>
                {activeIdeas.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                    아직 아이디어가 없습니다
                  </div>
                ) : (
                  activeIdeas.map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => setSelectedIdea(idea)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedIdea?.id === idea.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {idea.rawIdea.slice(0, 50)}
                        {idea.rawIdea.length > 50 && '...'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            idea.stage === 'ai_feedback' || idea.stage === 'ready'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {idea.stage === 'raw' && '초기'}
                          {idea.stage === 'exploring' && '탐색 중'}
                          {idea.stage === 'structured' && '구조화됨'}
                          {idea.stage === 'ai_feedback' && 'AI 피드백'}
                          {idea.stage === 'ready' && '준비됨'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.floor(idea.thinkingDuration / 60)}분 고민
                        </span>
                      </div>
                    </button>
                  ))
                )}

                {/* Delete Button */}
                {selectedIdea && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteIdea(selectedIdea.id)}
                  >
                    아이디어 삭제
                  </Button>
                )}
              </div>

              {/* Idea Form */}
              <div className="lg:col-span-2">
                <IdeaForm
                  idea={selectedIdea}
                  onSubmit={handleSaveIdea}
                  onRequestFeedback={handleRequestFeedback}
                  onConvert={handleConvertToVenture}
                  isRequestingFeedback={isRequestingFeedback}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
