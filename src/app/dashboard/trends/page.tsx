'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, TrendingUp, Sparkles, Trash2, RefreshCw, ExternalLink, ArrowUp, MessageSquare, Newspaper } from 'lucide-react'
import type { TrendItem, TrendCollection, TrendSource, NewsTrendItem, NewsTrendPlatform } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import * as firestore from '@/lib/firebase/firestore'

// 오프라인 에러인지 확인
const isOfflineError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('offline') || error.message.includes('network')
  }
  return false
}

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

type TabType = 'news' | 'manual'

const platformInfo: Record<NewsTrendPlatform, { name: string; color: string; icon: string }> = {
  geeknews: { name: 'GeekNews', color: 'bg-green-100 text-green-800', icon: '🤓' },
  hackernews: { name: 'Hacker News', color: 'bg-orange-100 text-orange-800', icon: '🔥' },
  producthunt: { name: 'Product Hunt', color: 'bg-red-100 text-red-800', icon: '🚀' },
  disquiet: { name: 'Disquiet', color: 'bg-purple-100 text-purple-800', icon: '💡' },
}

export default function TrendsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('news')
  const [collection, setCollection] = useState<TrendCollection | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newKeywords, setNewKeywords] = useState('')
  const [newSource, setNewSource] = useState<TrendSource>('manual')
  const [analyzing, setAnalyzing] = useState(false)
  const [summary, setSummary] = useState<TrendSummary | null>(null)

  // 뉴스 트렌드 상태
  const [newsTrends, setNewsTrends] = useState<NewsTrendItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)
  const [crawling, setCrawling] = useState(false)
  const [lastCrawled, setLastCrawled] = useState<string>('')
  const [platformFilter, setPlatformFilter] = useState<NewsTrendPlatform | 'all'>('all')

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

  // 뉴스 트렌드 불러오기
  useEffect(() => {
    if (user) {
      loadNewsTrends()
    }
  }, [user])

  const loadNewsTrends = async () => {
    if (!user) return
    setNewsLoading(true)
    try {
      const data = await firestore.getNewsTrends(user.uid)
      setNewsTrends(data.items)
      setLastCrawled(data.crawledAt)
    } catch (error) {
      if (!isOfflineError(error)) {
        console.error('Failed to load news trends:', error)
      }
    } finally {
      setNewsLoading(false)
    }
  }

  const handleCrawlTrends = async () => {
    setCrawling(true)
    try {
      const res = await fetch('/api/crawl-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: ['geeknews', 'hackernews', 'producthunt', 'disquiet']
        }),
      })
      const data = await res.json()

      if (data.items && user) {
        // Firestore에 저장
        const saved = await firestore.saveNewsTrends(user.uid, data.items)
        setNewsTrends(saved.items)
        setLastCrawled(saved.crawledAt)
      }
    } catch (error) {
      console.error('Crawl failed:', error)
    } finally {
      setCrawling(false)
    }
  }

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

  const filteredNews = platformFilter === 'all'
    ? newsTrends
    : newsTrends.filter(item => item.platform === platformFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">트렌드</h1>
          <p className="text-gray-600 mt-2">
            기술 뉴스와 트렌드를 수집하고 분석하세요
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'news' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('news')}
        >
          <Newspaper className="w-4 h-4 mr-2" />
          뉴스/트렌드
        </Button>
        <Button
          variant={activeTab === 'manual' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('manual')}
        >
          <Plus className="w-4 h-4 mr-2" />
          수동 수집
        </Button>
      </div>

      {activeTab === 'news' && (
        <div className="space-y-4">
          {/* 크롤링 컨트롤 */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={platformFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlatformFilter('all')}
              >
                전체 ({newsTrends.length})
              </Button>
              {(Object.keys(platformInfo) as NewsTrendPlatform[]).map(platform => {
                const count = newsTrends.filter(i => i.platform === platform).length
                return (
                  <Button
                    key={platform}
                    variant={platformFilter === platform ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlatformFilter(platform)}
                  >
                    {platformInfo[platform].icon} {platformInfo[platform].name} ({count})
                  </Button>
                )
              })}
            </div>
            <Button onClick={handleCrawlTrends} disabled={crawling}>
              {crawling ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {crawling ? '수집 중...' : '새로고침'}
            </Button>
          </div>

          {lastCrawled && (
            <p className="text-sm text-gray-500">
              마지막 수집: {new Date(lastCrawled).toLocaleString('ko-KR')}
            </p>
          )}

          {/* 뉴스 목록 */}
          {newsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="grid gap-3">
              {filteredNews.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${platformInfo[item.platform].color}`}>
                            {platformInfo[item.platform].icon} {platformInfo[item.platform].name}
                          </span>
                          {item.score !== undefined && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                              <ArrowUp className="w-3 h-3" />
                              {item.score}
                            </span>
                          )}
                          {item.comments !== undefined && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3" />
                              {item.comments}
                            </span>
                          )}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-blue-600 flex items-start gap-1"
                        >
                          {item.title}
                          <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0" />
                        </a>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.map((tag, i) => (
                              <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Newspaper className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>아직 수집된 뉴스가 없습니다.</p>
                <p className="text-sm mt-1">새로고침 버튼을 눌러 최신 트렌드를 수집하세요.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <>
          <div className="flex justify-end gap-2">
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
        </>
      )}
    </div>
  )
}
