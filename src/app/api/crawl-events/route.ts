import { NextRequest, NextResponse } from 'next/server'
import type { EventSource, EventItem } from '@/types'

interface CrawlError {
  sourceId: string
  sourceName: string
  message: string
}

interface CrawlResult {
  events: EventItem[]
  errors: CrawlError[]
}

// HTTP 요청 헬퍼
async function fetchWithHeaders(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// OnOffMix 상세 페이지에서 이벤트 정보 추출
async function fetchOnOffMixDetail(eventId: string): Promise<{
  title: string
  description: string
  eventDate: string
  eventEndDate?: string
  location: string
  cost: string
  tags: string[]
  capacity?: string
} | null> {
  try {
    const html = await fetchWithHeaders(`https://onoffmix.com/event/${eventId}`)

    // 제목 추출 - og:title 또는 h1
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const title = ogTitleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || ''

    // 날짜 추출 - txt_date 클래스 또는 일반 패턴
    const dateClassMatch = html.match(/class="txt_date"[^>]*>([^<]+)</i)
    const datePatternMatch = html.match(/(\d{4}\.\d{1,2}\.\d{1,2}\s*\([^)]+\)\s*\d{2}:\d{2})\s*~\s*(\d{4}\.\d{1,2}\.\d{1,2}\s*\([^)]+\)\s*\d{2}:\d{2})/)

    let eventDate = new Date().toISOString()
    let eventEndDate: string | undefined

    const parseKoreanDate = (str: string): string => {
      const match = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2}).*?(\d{2}):(\d{2})/)
      if (match) {
        const [, year, month, day, hour, minute] = match
        // KST(+09:00) 타임존으로 ISO 문자열 직접 생성 (타임존 변환 버그 방지)
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:00+09:00`
      }
      return new Date().toISOString()
    }

    if (dateClassMatch) {
      const dateStr = dateClassMatch[1]
      const parts = dateStr.split('~').map(s => s.trim())
      if (parts[0]) eventDate = parseKoreanDate(parts[0])
      if (parts[1]) eventEndDate = parseKoreanDate(parts[1])
    } else if (datePatternMatch) {
      eventDate = parseKoreanDate(datePatternMatch[1])
      eventEndDate = parseKoreanDate(datePatternMatch[2])
    }

    // 장소 추출 - place_info 클래스 또는 주소 패턴
    const placeMatch = html.match(/class="place_info"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i)
    const addressMatch = html.match(/(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\n<]{5,80}/i)
    const onlineMatch = html.match(/온라인|ZOOM|zoom|Zoom|화상|비대면/i)

    let location = '장소 미정'
    if (placeMatch) {
      location = placeMatch[1].trim()
    } else if (onlineMatch) {
      location = '온라인'
    } else if (addressMatch) {
      location = addressMatch[0].trim().substring(0, 50)
    }

    // 설명 추출 - og:description
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
    const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
    let description = ogDescMatch?.[1] || metaDescMatch?.[1] || ''
    description = description.replace(/\s+/g, ' ').trim().substring(0, 300)

    // 비용 추출
    const freeMatch = html.match(/무료/i)
    const priceMatch = html.match(/(\d{1,3}(,\d{3})*)\s*원/)
    const cost = freeMatch ? '무료' : priceMatch ? `${priceMatch[1]}원` : '정보 없음'

    // 태그 추출 - 해시태그 형식 (#스타트업)
    const hashtagMatches = html.matchAll(/href="[^"]*s=%23([^"&]+)"/g)
    const tags: string[] = []
    for (const match of hashtagMatches) {
      try {
        const decoded = decodeURIComponent(match[1])
        if (decoded && !tags.includes(decoded)) {
          tags.push(decoded)
        }
      } catch {
        // 디코딩 실패 무시
      }
    }

    // 정원 추출
    const capacityMatch = html.match(/정원\s*(\d+)\s*명/)
    const capacity = capacityMatch ? `${capacityMatch[1]}명` : undefined

    return {
      title,
      description,
      eventDate,
      eventEndDate,
      location,
      cost,
      tags: tags.slice(0, 5),
      capacity
    }
  } catch (error) {
    console.error(`Failed to fetch detail for ${eventId}:`, error)
    return null
  }
}

// OnOffMix 이벤트 파싱 (상세 정보 포함)
async function crawlOnOffMix(source: EventSource): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    const html = await fetchWithHeaders(source.url)

    // 이벤트 ID 추출
    const eventIds = new Set<string>()
    const eventIdRegex = /\/event\/(\d+)/g
    let match
    while ((match = eventIdRegex.exec(html)) !== null) {
      eventIds.add(match[1])
    }

    console.log(`Found ${eventIds.size} events from ${source.name}`)

    // 각 이벤트의 상세 정보 가져오기 (최대 10개)
    const eventIdArray = Array.from(eventIds).slice(0, 10)

    for (const eventId of eventIdArray) {
      const detail = await fetchOnOffMixDetail(eventId)

      if (detail && detail.title) {
        events.push({
          id: `onoffmix-${eventId}`,
          sourceId: source.id,
          platform: 'onoffmix',
          title: detail.title,
          description: detail.description,
          eventDate: detail.eventDate,
          eventEndDate: detail.eventEndDate,
          location: detail.location,
          isOnline: detail.location.includes('온라인'),
          registrationUrl: `https://onoffmix.com/event/${eventId}`,
          cost: detail.cost,
          tags: detail.tags.length > 0 ? detail.tags : source.keywords,
          status: 'upcoming',
          crawledAt: new Date().toISOString(),
        })
      }

      // Rate limiting: 500ms 딜레이
      await new Promise(resolve => setTimeout(resolve, 500))
    }

  } catch (error) {
    console.error('OnOffMix crawl error:', error)
    throw error
  }

  return events
}

// Meetup 이벤트 파싱
async function crawlMeetup(source: EventSource): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    const html = await fetchWithHeaders(source.url)

    // JSON-LD 스크립트에서 이벤트 데이터 추출
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)

    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1])
        const eventList = data['@type'] === 'Event' ? [data] :
                         Array.isArray(data) ? data.filter((d: Record<string, unknown>) => d['@type'] === 'Event') : []

        for (const event of eventList) {
          events.push({
            id: `meetup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceId: source.id,
            platform: 'meetup',
            title: event.name || '제목 없음',
            description: event.description?.replace(/<[^>]+>/g, '').substring(0, 300),
            eventDate: event.startDate || new Date().toISOString(),
            eventEndDate: event.endDate,
            location: event.location?.name || event.location?.address?.addressLocality || '온라인',
            isOnline: event.eventAttendanceMode?.includes('Online') || false,
            registrationUrl: event.url || source.url,
            imageUrl: event.image,
            organizer: event.organizer?.name,
            cost: event.offers?.price === 0 ? '무료' : event.offers?.price ? `${event.offers.price}원` : '정보 없음',
            tags: source.keywords,
            status: 'upcoming',
            crawledAt: new Date().toISOString(),
          })
        }
      } catch {
        // JSON 파싱 실패 무시
      }
    }

  } catch (error) {
    console.error('Meetup crawl error:', error)
    throw error
  }

  return events
}

// Festa 이벤트 파싱 (현재 서비스 중단)
async function crawlFesta(source: EventSource): Promise<EventItem[]> {
  // festa.io가 현재 "under construction" 상태
  // 서비스 재개 시 크롤러 구현 필요
  console.log('Festa is currently unavailable (under construction)')
  return []
}

// 플랫폼별 크롤러 선택
async function crawlSource(source: EventSource): Promise<EventItem[]> {
  switch (source.platform) {
    case 'onoffmix':
      return crawlOnOffMix(source)
    case 'meetup':
      return crawlMeetup(source)
    case 'festa':
      return crawlFesta(source)
    default:
      return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sources } = await req.json() as { sources: EventSource[] }

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json({ error: 'sources array is required' }, { status: 400 })
    }

    const result: CrawlResult = {
      events: [],
      errors: [],
    }

    // 순차적으로 크롤링
    for (const source of sources) {
      if (!source.isActive) continue

      try {
        const events = await crawlSource(source)
        result.events.push(...events)

        // 소스 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        result.errors.push({
          sourceId: source.id,
          sourceName: source.name,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // 중복 제거
    const uniqueEvents = Array.from(
      new Map(result.events.map(e => [e.id, e])).values()
    )

    // 지난 이벤트 필터링 (오늘 이후 이벤트만)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // 오늘 자정 기준
    const futureEvents = uniqueEvents.filter(e => {
      const eventDate = new Date(e.eventDate)
      return eventDate >= now
    })

    // 날짜순 정렬
    futureEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

    return NextResponse.json({
      events: futureEvents,
      errors: result.errors,
      totalCrawled: futureEvents.length,
      filteredOut: uniqueEvents.length - futureEvents.length,
      sourcesProcessed: sources.filter(s => s.isActive).length,
    })

  } catch (error) {
    console.error('Crawl API error:', error)
    return NextResponse.json(
      { error: 'Failed to crawl events' },
      { status: 500 }
    )
  }
}
