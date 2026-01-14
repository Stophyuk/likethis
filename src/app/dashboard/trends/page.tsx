'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, TrendingUp, Sparkles, Trash2, RefreshCw } from 'lucide-react'
import type { TrendItem, TrendCollection, TrendSource } from '@/types'

const STORAGE_KEY = 'likethis_trends'

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function loadTrends(): TrendCollection | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const collections = JSON.parse(saved) as TrendCollection[]
    return collections.find(c => c.date === getToday()) || null
  }
  return null
}

function saveTrends(collection: TrendCollection) {
  if (typeof window === 'undefined') return
  const saved = localStorage.getItem(STORAGE_KEY)
  let collections: TrendCollection[] = saved ? JSON.parse(saved) : []
  const index = collections.findIndex(c => c.date === collection.date)
  if (index >= 0) {
    collections[index] = collection
  } else {
    collections.unshift(collection)
  }
  // 최근 30일만 유지
  collections = collections.slice(0, 30)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
}

interface TrendSummary {
  summary: string
  hotTopics: Array<{
    topic: string
    description: string
    contentIdeas: string[]
  }>
  keywords: {
    trending: string[]
    recommended: string[]
  }
  contentSuggestions: Array<{
    platform: string
    title: string
    hook: string
    angle: string
  }>
  timing: string
  analyzedAt: string
}

export default function TrendsPage() {
  const [collection, setCollection] = useState<TrendCollection | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newKeywords, setNewKeywords] = useState('')
  const [newSource, setNewSource] = useState<TrendSource>('manual')
  const [analyzing, setAnalyzing] = useState(false)
  const [summary, setSummary] = useState<TrendSummary | null>(null)

  useEffect(() => {
    const saved = loadTrends()
    if (saved) {
      setCollection(saved)
      if (saved.summary) {
        try {
          setSummary(JSON.parse(saved.summary))
        } catch {}
      }
    }
  }, [])

  const handleAddTrend = () => {
    if (!newContent.trim()) return

    const item: TrendItem = {
      id: Date.now().toString(),
      source: newSource,
      content: newContent,
      keywords: newKeywords.split(',').map(k => k.trim()).filter(Boolean),
      collectedAt: new Date().toISOString(),
    }

    const today = getToday()
    const updated: TrendCollection = collection
      ? { ...collection, items: [...collection.items, item] }
      : { id: today, date: today, items: [item] }

    setCollection(updated)
    saveTrends(updated)
    setNewContent('')
    setNewKeywords('')
    setShowAddForm(false)
  }

  const handleDeleteTrend = (id: string) => {
    if (!collection) return
    const updated = {
      ...collection,
      items: collection.items.filter(item => item.id !== id),
    }
    setCollection(updated)
    saveTrends(updated)
  }

  const handleAnalyze = async () => {
    if (!collection || collection.items.length === 0) return

    setAnalyzing(true)
    try {
      const res = await fetch('/api/summarize-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: collection.items }),
      })
      const data = await res.json()
      setSummary(data)

      // 분석 결과 저장
      const updated = {
        ...collection,
        summary: JSON.stringify(data),
        analyzedAt: new Date().toISOString(),
      }
      setCollection(updated)
      saveTrends(updated)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const getSourceLabel = (source: TrendSource) => {
    switch (source) {
      case 'kakao': return '카카오톡'
      case 'community': return '커뮤니티'
      case 'manual': return '수동입력'
    }
  }

  const getSourceColor = (source: TrendSource) => {
    switch (source) {
      case 'kakao': return 'bg-yellow-100 text-yellow-800'
      case 'community': return 'bg-blue-100 text-blue-800'
      case 'manual': return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">트렌드 수집</h1>
          <p className="text-gray-600 mt-2">
            카카오톡, 커뮤니티 등에서 수집한 트렌드를 관리하고 분석하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            트렌드 추가
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !collection?.items.length}
          >
            {analyzing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {analyzing ? '분석 중...' : '트렌드 분석'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">새 트렌드 추가</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {(['manual', 'kakao', 'community'] as TrendSource[]).map(source => (
                <Button
                  key={source}
                  variant={newSource === source ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewSource(source)}
                >
                  {getSourceLabel(source)}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="트렌드 내용을 입력하세요..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
            />
            <Input
              placeholder="키워드 (쉼표로 구분)"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
            />
            <Button onClick={handleAddTrend}>추가</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 수집된 트렌드 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              오늘의 트렌드
            </CardTitle>
            <CardDescription>
              {collection?.items.length || 0}개 수집됨
            </CardDescription>
          </CardHeader>
          <CardContent>
            {collection?.items.length ? (
              <div className="space-y-3">
                {collection.items.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${getSourceColor(item.source)}`}>
                          {getSourceLabel(item.source)}
                        </span>
                        <p className="mt-2 text-sm">{item.content}</p>
                        {item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.keywords.map((kw, i) => (
                              <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => handleDeleteTrend(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                아직 수집된 트렌드가 없습니다. 카카오톡 분석이나 수동으로 추가해보세요.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 분석 결과 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              트렌드 분석 결과
            </CardTitle>
            {summary?.analyzedAt && (
              <CardDescription>
                {new Date(summary.analyzedAt).toLocaleString('ko-KR')} 분석
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">요약</h4>
                  <p className="text-sm">{summary.summary}</p>
                </div>

                {summary.hotTopics?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">주목 토픽</h4>
                    <div className="space-y-2">
                      {summary.hotTopics.map((topic, i) => (
                        <div key={i} className="p-2 bg-orange-50 rounded">
                          <p className="font-medium text-sm">{topic.topic}</p>
                          <p className="text-xs text-gray-600 mt-1">{topic.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.keywords && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">키워드</h4>
                    <div className="flex flex-wrap gap-1">
                      {summary.keywords.trending?.map((kw, i) => (
                        <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                      {summary.keywords.recommended?.map((kw, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {summary.contentSuggestions?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-2">콘텐츠 제안</h4>
                    <div className="space-y-2">
                      {summary.contentSuggestions.map((suggestion, i) => (
                        <div key={i} className="p-2 bg-blue-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-200 px-1.5 py-0.5 rounded">
                              {suggestion.platform}
                            </span>
                            <p className="font-medium text-sm">{suggestion.title}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{suggestion.hook}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.timing && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">게시 타이밍</h4>
                    <p className="text-sm">{summary.timing}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                트렌드를 수집한 후 분석 버튼을 눌러주세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
