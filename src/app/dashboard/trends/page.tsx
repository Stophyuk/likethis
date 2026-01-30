'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, TrendingUp, Sparkles, Trash2, RefreshCw, ExternalLink, ArrowUp, MessageSquare, Newspaper, Lightbulb, Users, Brain, History, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import type { TrendItem, TrendCollection, TrendSource, NewsTrendItem, NewsTrendPlatform, WeeklyTrendAnalysis } from '@/types'
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
  eopla: { name: 'Eopla', color: 'bg-blue-100 text-blue-800', icon: '📰' },
  reddit: { name: 'Reddit', color: 'bg-orange-100 text-orange-800', icon: '🔗' },
  d2naver: { name: 'D2 Naver', color: 'bg-green-100 text-green-800', icon: '🟢' },
  kakaotech: { name: 'Kakao Tech', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  daangn: { name: '당근 Tech', color: 'bg-orange-100 text-orange-800', icon: '🥕' },
  velog: { name: 'Velog', color: 'bg-teal-100 text-teal-800', icon: '📝' },
  yozm: { name: '요즘IT', color: 'bg-indigo-100 text-indigo-800', icon: '💻' },
}

const ANALYSIS_HISTORY_KEY = 'likethis_trend_analysis_history'

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

  // 기회 해석 상태
  const [translating, setTranslating] = useState(false)
  const [opportunityData, setOpportunityData] = useState<{
    summary: string
    opportunities: Array<{
      title: string
      forWhom: string
      description: string
      actionItems: string[]
      difficulty: 'easy' | 'medium' | 'hard'
      timeframe: string
    }>
    glossary: Array<{ term: string; simple: string }>
    contentIdeas: Array<{ topic: string; angle: string; targetAudience: string }>
  } | null>(null)

  // 7일 AI 분석 상태
  const [weeklyAnalyzing, setWeeklyAnalyzing] = useState(false)
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyTrendAnalysis | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<WeeklyTrendAnalysis[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set())

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

    // Load analysis history from localStorage
    const historyStr = localStorage.getItem(ANALYSIS_HISTORY_KEY)
    if (historyStr) {
      try {
        const history = JSON.parse(historyStr) as WeeklyTrendAnalysis[]
        setAnalysisHistory(history)
        if (history.length > 0) {
          setWeeklyAnalysis(history[0]) // Show most recent
        }
      } catch {}
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
          platforms: ['geeknews', 'hackernews', 'producthunt', 'disquiet', 'eopla', 'reddit', 'd2naver', 'kakaotech', 'velog', 'yozm']
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

  // 7일 AI 분석
  const handleWeeklyAnalysis = async () => {
    if (newsTrends.length === 0) return

    setWeeklyAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-weekly-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newsTrends }),
      })

      if (!res.ok) throw new Error('Analysis failed')

      const analysis: WeeklyTrendAnalysis = await res.json()
      setWeeklyAnalysis(analysis)

      // Save to history (keep last 10)
      const newHistory = [analysis, ...analysisHistory].slice(0, 10)
      setAnalysisHistory(newHistory)
      localStorage.setItem(ANALYSIS_HISTORY_KEY, JSON.stringify(newHistory))

      // Save latest analysis for content factory
      localStorage.setItem('likethis_trend_analysis', JSON.stringify(analysis))

      // Also save to Firestore if user is logged in
      if (user) {
        try {
          await firestore.saveTrendAnalysis(user.uid, analysis)
        } catch (e) {
          console.error('Failed to save analysis to Firestore:', e)
        }
      }
    } catch (error) {
      console.error('Weekly analysis failed:', error)
      alert('분석에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setWeeklyAnalyzing(false)
    }
  }

  const toggleInsight = (index: number) => {
    const newSet = new Set(expandedInsights)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setExpandedInsights(newSet)
  }

  const handleTranslateOpportunity = async () => {
    if (filteredNews.length === 0) return

    setTranslating(true)
    try {
      const res = await fetch('/api/translate-opportunity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: filteredNews }),
      })
      const data = await res.json()
      setOpportunityData(data)
    } catch (error) {
      console.error('Translation failed:', error)
    } finally {
      setTranslating(false)
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
            <div className="flex gap-2">
              <Button
                onClick={handleWeeklyAnalysis}
                disabled={weeklyAnalyzing || newsTrends.length === 0}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {weeklyAnalyzing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {weeklyAnalyzing ? '분석 중...' : 'AI 분석'}
              </Button>
              <Button
                variant="outline"
                onClick={handleTranslateOpportunity}
                disabled={translating || filteredNews.length === 0}
              >
                {translating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4 mr-2" />
                )}
                {translating ? '분석 중...' : '기회 해석'}
              </Button>
              <Button onClick={handleCrawlTrends} disabled={crawling} variant="outline">
                {crawling ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {crawling ? '수집 중...' : '새로고침'}
              </Button>
            </div>
          </div>

          {lastCrawled && (
            <p className="text-sm text-gray-500">
              마지막 수집: {new Date(lastCrawled).toLocaleString('ko-KR')}
            </p>
          )}

          {/* 7일 AI 분석 결과 */}
          {weeklyAnalysis && (
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    7일 트렌드 AI 분석
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="w-4 h-4 mr-1" />
                      히스토리
                      {showHistory ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </Button>
                    <span className="text-xs text-gray-500">
                      {new Date(weeklyAnalysis.analyzedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <CardDescription>
                  {weeklyAnalysis.totalItemsAnalyzed}개 항목 분석
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 요약 */}
                <div className="bg-white/80 rounded-lg p-4">
                  <p className="text-gray-800">{weeklyAnalysis.summary}</p>
                </div>

                {/* 핫토픽 */}
                {weeklyAnalysis.hotTopics?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-purple-800 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> 핫토픽
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {weeklyAnalysis.hotTopics.map((topic, i) => (
                        <div key={i} className="bg-white/80 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{topic.topic}</span>
                            <span className="text-xs text-purple-600">🔥 {topic.frequency}/10</span>
                          </div>
                          <p className="text-xs text-gray-600">{topic.description}</p>
                          <div className="flex gap-1 mt-1">
                            {topic.sources.slice(0, 3).map((src, j) => (
                              <span key={j} className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                {src}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 인사이트 */}
                {weeklyAnalysis.insights?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" /> 인사이트
                    </h4>
                    <div className="space-y-2">
                      {weeklyAnalysis.insights.map((insight, i) => (
                        <div key={i} className="bg-white/80 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleInsight(i)}
                            className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
                          >
                            <span className="font-medium text-sm">{insight.title}</span>
                            {expandedInsights.has(i) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {expandedInsights.has(i) && (
                            <div className="px-3 pb-3 border-t">
                              <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
                              {insight.actionItems?.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {insight.actionItems.map((item, j) => (
                                    <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                                      <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 추천 액션 */}
                {weeklyAnalysis.recommendedActions?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-green-800 mb-2 flex items-center gap-1">
                      <Zap className="w-4 h-4" /> 추천 액션
                    </h4>
                    <div className="space-y-2">
                      {weeklyAnalysis.recommendedActions.map((action, i) => (
                        <div key={i} className="bg-white/80 rounded-lg p-3 flex items-start gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex-shrink-0">
                            {action.platform}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{action.action}</p>
                            <p className="text-xs text-gray-500">{action.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 키워드 */}
                {weeklyAnalysis.keywords && (
                  <div className="flex flex-wrap gap-2">
                    {weeklyAnalysis.keywords.trending?.map((kw, i) => (
                      <span key={`t-${i}`} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        🔥 {kw}
                      </span>
                    ))}
                    {weeklyAnalysis.keywords.emerging?.map((kw, i) => (
                      <span key={`e-${i}`} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        🌱 {kw}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 분석 히스토리 */}
          {showHistory && analysisHistory.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">분석 히스토리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisHistory.slice(1).map((analysis, i) => (
                    <button
                      key={analysis.id}
                      onClick={() => setWeeklyAnalysis(analysis)}
                      className="w-full text-left p-2 rounded hover:bg-gray-50 border flex items-center justify-between"
                    >
                      <span className="text-sm">
                        {new Date(analysis.analyzedAt).toLocaleDateString('ko-KR')} 분석
                      </span>
                      <span className="text-xs text-gray-500">
                        {analysis.totalItemsAnalyzed}개 항목
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
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

          {/* 기회 해석 결과 */}
          {opportunityData && (
            <div className="space-y-4 mt-6 pt-6 border-t">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                비개발자를 위한 기회 해석
              </h2>

              {/* 요약 */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="py-4">
                  <p className="text-gray-800">{opportunityData.summary}</p>
                </CardContent>
              </Card>

              {/* 기회 목록 */}
              {opportunityData.opportunities?.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {opportunityData.opportunities.map((opp, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{opp.title}</CardTitle>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            opp.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            opp.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {opp.difficulty === 'easy' ? '쉬움' : opp.difficulty === 'medium' ? '보통' : '어려움'}
                          </span>
                        </div>
                        <CardDescription className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {opp.forWhom}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-700">{opp.description}</p>
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 mb-1">실행 항목</h4>
                          <ul className="space-y-1">
                            {opp.actionItems.map((item, j) => (
                              <li key={j} className="text-sm text-gray-600 flex items-start gap-1">
                                <span className="text-green-500">→</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-xs text-gray-400">
                          소요 시간: {opp.timeframe}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* 용어 사전 */}
              {opportunityData.glossary?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">용어 사전</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {opportunityData.glossary.map((item, i) => (
                        <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium text-purple-600">{item.term}</span>
                          <span className="text-gray-500 mx-1">=</span>
                          <span className="text-gray-700">{item.simple}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 콘텐츠 아이디어 */}
              {opportunityData.contentIdeas?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">콘텐츠 아이디어</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {opportunityData.contentIdeas.map((idea, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-sm">{idea.topic}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="text-blue-600">앵글:</span> {idea.angle}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            타겟: {idea.targetAudience}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
