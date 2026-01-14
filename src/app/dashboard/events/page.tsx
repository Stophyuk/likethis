'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ExternalLink, Calendar, MapPin, Loader2, Sparkles, Clock, DollarSign } from 'lucide-react'
import type { EventSource, EventItem, EventSourcePlatform } from '@/types'

const STORAGE_KEY = 'likethis_events'
const CACHE_DURATION = 30 * 60 * 1000 // 30분

// 기본 등록 소스 목록
const DEFAULT_SOURCES: EventSource[] = [
  { id: 'onoffmix-startup', platform: 'onoffmix', name: '스타트업', url: 'https://onoffmix.com/event?s=스타트업', keywords: ['스타트업'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-ai', platform: 'onoffmix', name: 'AI/인공지능', url: 'https://onoffmix.com/event?s=AI', keywords: ['AI', '인공지능'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-entrepreneur', platform: 'onoffmix', name: '창업', url: 'https://onoffmix.com/event?s=창업', keywords: ['창업'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-developer', platform: 'onoffmix', name: '개발자', url: 'https://onoffmix.com/event?s=개발자', keywords: ['개발', '코딩'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-tech', platform: 'onoffmix', name: '테크', url: 'https://onoffmix.com/event?s=테크', keywords: ['테크', 'tech'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-networking', platform: 'onoffmix', name: '네트워킹', url: 'https://onoffmix.com/event?s=네트워킹', keywords: ['네트워킹'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-hackathon', platform: 'onoffmix', name: '해커톤', url: 'https://onoffmix.com/event?s=해커톤', keywords: ['해커톤'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'meetup-tech', platform: 'meetup', name: 'Seoul Tech', url: 'https://www.meetup.com/find/?location=kr--Seoul&source=EVENTS&keywords=tech', keywords: ['tech'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'meetup-startup', platform: 'meetup', name: 'Seoul Startup', url: 'https://www.meetup.com/find/?location=kr--Seoul&source=EVENTS&keywords=startup', keywords: ['startup'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'meetup-ai', platform: 'meetup', name: 'Seoul AI', url: 'https://www.meetup.com/find/?location=kr--Seoul&source=EVENTS&keywords=AI', keywords: ['AI'], isActive: true, createdAt: new Date().toISOString() },
]

// 플랫폼별 색상
const platformColors: Record<EventSourcePlatform, string> = {
  onoffmix: '#FF6B35',
  meetup: '#F65858',
  festa: '#7B68EE',
  custom: '#6B7280',
}

// 추천 verdict 색상
const verdictConfig: Record<string, { color: string; bg: string; label: string }> = {
  'must-go': { color: '#16A34A', bg: '#DCFCE7', label: '꼭 가세요!' },
  'recommended': { color: '#2563EB', bg: '#DBEAFE', label: '추천' },
  'optional': { color: '#CA8A04', bg: '#FEF9C3', label: '선택적' },
  'skip': { color: '#DC2626', bg: '#FEE2E2', label: '패스' },
}

interface EventWithRecommendation extends EventItem {
  recommendation?: {
    score: number
    verdict: string
    reason: string
    insights: string[]
  }
}

// 날짜 포맷팅
function formatEventDate(dateStr: string, endDateStr?: string): string {
  const start = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }

  let result = start.toLocaleDateString('ko-KR', options)

  if (endDateStr) {
    const end = new Date(endDateStr)
    if (start.toDateString() !== end.toDateString()) {
      result += ` ~ ${end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
    }
  }

  return result
}

// 날짜별 그룹핑
function groupEventsByDate(events: EventWithRecommendation[]): Record<string, EventWithRecommendation[]> {
  const groups: Record<string, EventWithRecommendation[]> = {}

  for (const event of events) {
    const date = new Date(event.eventDate).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })

    if (!groups[date]) groups[date] = []
    groups[date].push(event)
  }

  return groups
}

export default function EventsPage() {
  const [sources] = useState<EventSource[]>(DEFAULT_SOURCES)
  const [events, setEvents] = useState<EventWithRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [lastCrawled, setLastCrawled] = useState<string | null>(null)
  const [filterVerdict, setFilterVerdict] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'recommended'>('all')

  // 캐시에서 로드
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const { events: cachedEvents, lastCrawled: cachedTime } = JSON.parse(cached)
        setEvents(cachedEvents)
        setLastCrawled(cachedTime)

        if (Date.now() - new Date(cachedTime).getTime() > CACHE_DURATION) {
          handleRefresh()
        }
      } catch {
        handleRefresh()
      }
    } else {
      handleRefresh()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 크롤링 실행
  const handleRefresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/crawl-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: sources.filter(s => s.isActive) }),
      })

      if (!res.ok) throw new Error('크롤링 실패')

      const data = await res.json()
      setEvents(data.events || [])

      const now = new Date().toISOString()
      setLastCrawled(now)

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        events: data.events,
        lastCrawled: now,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '크롤링 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // AI 추천 분석
  const handleAnalyze = async () => {
    if (events.length === 0) return

    setAnalyzing(true)
    try {
      // 사용자 관심사 로드
      const interests = JSON.parse(localStorage.getItem('likethis_interests') || '[]')

      const res = await fetch('/api/recommend-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          userProfile: {
            interests: interests.length > 0 ? interests : ['스타트업', 'AI', '개발'],
            role: '스타트업 관계자',
            goals: ['네트워킹', '인사이트 획득', '트렌드 파악'],
          },
        }),
      })

      if (!res.ok) throw new Error('분석 실패')

      const data = await res.json()
      setEvents(data.events)
      setViewMode('recommended')

      // 캐시 업데이트
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        events: data.events,
        lastCrawled,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 중 오류가 발생했습니다')
    } finally {
      setAnalyzing(false)
    }
  }

  // 필터링
  const filteredEvents = events.filter(e => {
    if (viewMode === 'recommended' && !e.recommendation) return false
    if (filterVerdict && e.recommendation?.verdict !== filterVerdict) return false
    return true
  })

  // 추천 이벤트만 볼 때는 점수순, 아니면 날짜순
  const sortedEvents = viewMode === 'recommended'
    ? [...filteredEvents].sort((a, b) => (b.recommendation?.score || 0) - (a.recommendation?.score || 0))
    : filteredEvents

  const groupedEvents = viewMode === 'all' ? groupEventsByDate(sortedEvents) : null

  // 추천 통계
  const recommendationStats = {
    mustGo: events.filter(e => e.recommendation?.verdict === 'must-go').length,
    recommended: events.filter(e => e.recommendation?.verdict === 'recommended').length,
    optional: events.filter(e => e.recommendation?.verdict === 'optional').length,
    skip: events.filter(e => e.recommendation?.verdict === 'skip').length,
  }

  const hasRecommendations = events.some(e => e.recommendation)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">이벤트 모니터링</h1>
          <p className="text-gray-500 text-sm mt-1">
            한국 스타트업/테크 이벤트를 모니터링하고 AI가 추천해드립니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastCrawled && (
            <span className="text-xs text-gray-400">
              {new Date(lastCrawled).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing || events.length === 0} size="sm">
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI 추천
          </Button>
        </div>
      </div>

      {/* 소스 배지 */}
      <div className="flex flex-wrap gap-2">
        {sources.filter(s => s.isActive).map(source => (
          <Badge
            key={source.id}
            variant="outline"
            className="text-xs"
            style={{ borderColor: platformColors[source.platform], color: platformColors[source.platform] }}
          >
            {source.name}
          </Badge>
        ))}
      </div>

      {/* 뷰 모드 & 필터 */}
      {hasRecommendations && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 mr-4">
            <Button
              variant={viewMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setViewMode('all'); setFilterVerdict(null) }}
            >
              전체 ({events.length})
            </Button>
            <Button
              variant={viewMode === 'recommended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('recommended')}
            >
              AI 추천순
            </Button>
          </div>

          {viewMode === 'recommended' && (
            <>
              <Button
                variant={filterVerdict === null ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterVerdict(null)}
              >
                전체
              </Button>
              {Object.entries(verdictConfig).map(([key, config]) => {
                const count = key === 'must-go' ? recommendationStats.mustGo :
                             key === 'recommended' ? recommendationStats.recommended :
                             key === 'optional' ? recommendationStats.optional :
                             recommendationStats.skip
                return (
                  <Button
                    key={key}
                    variant={filterVerdict === key ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterVerdict(key)}
                    style={{ color: config.color }}
                  >
                    {config.label} ({count})
                  </Button>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && events.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">이벤트를 수집하고 있습니다...</span>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && events.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          수집된 이벤트가 없습니다. 새로고침을 눌러주세요.
        </div>
      )}

      {/* 추천순 보기 */}
      {viewMode === 'recommended' && (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedEvents.map(event => (
            <Card
              key={event.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden"
              style={{ borderLeftWidth: 4, borderLeftColor: platformColors[event.platform] }}
              onClick={() => window.open(event.registrationUrl, '_blank')}
            >
              {/* 추천 배지 */}
              {event.recommendation && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-lg"
                  style={{
                    backgroundColor: verdictConfig[event.recommendation.verdict]?.bg,
                    color: verdictConfig[event.recommendation.verdict]?.color,
                  }}
                >
                  {verdictConfig[event.recommendation.verdict]?.label} ({event.recommendation.score}/10)
                </div>
              )}

              <CardHeader className="pb-2 pr-24">
                <CardTitle className="text-base font-semibold leading-tight group-hover:text-blue-600">
                  {event.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 날짜 & 장소 */}
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{formatEventDate(event.eventDate, event.eventEndDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{event.isOnline ? '온라인' : event.location}</span>
                  </div>
                  {event.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span>{event.cost}</span>
                    </div>
                  )}
                </div>

                {/* 설명 */}
                {event.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                )}

                {/* AI 추천 이유 */}
                {event.recommendation && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium" style={{ color: verdictConfig[event.recommendation.verdict]?.color }}>
                      💡 {event.recommendation.reason}
                    </p>
                    {event.recommendation.insights.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-500">
                        {event.recommendation.insights.slice(0, 2).map((insight, i) => (
                          <li key={i}>• {insight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* 태그 & 플랫폼 */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-wrap gap-1">
                    {event.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 날짜별 보기 */}
      {viewMode === 'all' && groupedEvents && Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 sticky top-0 bg-gray-50 py-2 z-10">
            <Calendar className="w-5 h-5 text-gray-400" />
            {date}
            <Badge variant="secondary">{dateEvents.length}</Badge>
          </h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dateEvents.map(event => (
              <Card
                key={event.id}
                className="hover:shadow-md transition-shadow cursor-pointer group relative"
                style={{ borderLeftWidth: 4, borderLeftColor: platformColors[event.platform] }}
                onClick={() => window.open(event.registrationUrl, '_blank')}
              >
                {/* 추천 배지 (작게) */}
                {event.recommendation && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: verdictConfig[event.recommendation.verdict]?.bg,
                      color: verdictConfig[event.recommendation.verdict]?.color,
                    }}
                    title={`${verdictConfig[event.recommendation.verdict]?.label} (${event.recommendation.score}/10)`}
                  >
                    {event.recommendation.score}
                  </div>
                )}

                <CardHeader className="pb-2 pr-10">
                  <CardTitle className="text-sm font-medium leading-tight group-hover:text-blue-600">
                    {event.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatEventDate(event.eventDate, event.eventEndDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.isOnline ? '온라인' : event.location}</span>
                  </div>
                  {event.cost && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      <span>{event.cost}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1">
                      {event.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
