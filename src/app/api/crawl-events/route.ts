import { NextRequest, NextResponse } from 'next/server'
import type { EventSource, EventItem, EventType } from '@/types'

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
        const tags = detail.tags.length > 0 ? detail.tags : source.keywords
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
          tags,
          eventType: detectEventType(detail.title, tags),
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
          const title = event.name || '제목 없음'
          events.push({
            id: `meetup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceId: source.id,
            platform: 'meetup',
            title,
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
            eventType: detectEventType(title, source.keywords),
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

// 이벤트 유형 감지
function detectEventType(title: string, tags: string[]): EventType {
  const text = (title + ' ' + tags.join(' ')).toLowerCase()

  if (text.includes('세미나') || text.includes('seminar') || text.includes('강연') || text.includes('특강')) {
    return 'seminar'
  }
  if (text.includes('컨퍼런스') || text.includes('conference') || text.includes('con ') || text.includes('summit')) {
    return 'conference'
  }
  if (text.includes('워크숍') || text.includes('workshop') || text.includes('핸즈온') || text.includes('hands-on')) {
    return 'workshop'
  }
  if (text.includes('밋업') || text.includes('meetup') || text.includes('모임') || text.includes('네트워킹')) {
    return 'networking'
  }
  if (text.includes('스터디') || text.includes('study') || text.includes('부트캠프') || text.includes('bootcamp')) {
    return 'study'
  }

  return 'other'
}

// OKKY 이벤트 파싱 (IT 행사 게시판)
async function crawlOkky(): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    // OKKY events 페이지 (IT 행사)
    const html = await fetchWithHeaders('https://okky.kr/events')

    // JSON 데이터 추출 (페이지에 __NEXT_DATA__ 형식으로 포함됨)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)

    if (nextDataMatch) {
      const nextData = JSON.parse(nextDataMatch[1])
      const articles = nextData?.props?.pageProps?.articles?.content || []

      for (const article of articles.slice(0, 20)) {
        // IT 행사 카테고리만 필터 (promote 제외)
        if (article.category?.code === 'promote') continue

        const title = article.title || ''
        const tags = article.tags?.map((t: { name: string }) => t.name) || []

        // 세미나/컨퍼런스 관련 키워드 확인
        const isSeminarConference = /세미나|컨퍼런스|강연|특강|워크숍|밋업|summit|conference|seminar|workshop|meetup/i.test(title + tags.join(' '))

        if (!isSeminarConference && article.category?.code !== 'it') continue

        const eventType = detectEventType(title, tags)

        events.push({
          id: `okky-${article.id}`,
          sourceId: 'okky-events',
          platform: 'okky',
          title: title,
          description: article.contentExcerpt?.substring(0, 300) || '',
          eventDate: article.dateCreated || new Date().toISOString(),
          location: '상세 내용 참조',
          isOnline: /온라인|zoom|비대면|화상/i.test(title),
          registrationUrl: `https://okky.kr/articles/${article.id}`,
          organizer: article.author?.nickname,
          tags: tags.slice(0, 5),
          eventType,
          status: 'upcoming',
          crawledAt: new Date().toISOString(),
        })
      }
    }

    console.log(`OKKY: crawled ${events.length} events`)
  } catch (error) {
    console.error('OKKY crawl error:', error)
    throw error
  }

  return events
}

// dev-event.vercel.app 크롤러 (GitHub JSON 직접 접근)
async function crawlDevEvent(): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    // GitHub raw JSON에서 직접 데이터 가져오기
    const res = await fetch('https://raw.githubusercontent.com/brave-people/Dev-Event/master/data/events.json', {
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      // Fallback: HTML 스크래핑
      const html = await fetchWithHeaders('https://dev-event.vercel.app')
      const eventRegex = /<a[^>]*href="([^"]+)"[^>]*>\s*<div[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p[^>]*>([^<]*)<\/p>/g

      let match
      while ((match = eventRegex.exec(html)) !== null) {
        const [, url, title, dateStr] = match
        events.push({
          id: `dev-event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          sourceId: 'dev-event',
          platform: 'dev-event',
          title: title.trim(),
          description: '',
          eventDate: new Date().toISOString(),
          location: '상세 내용 참조',
          isOnline: false,
          registrationUrl: url.startsWith('http') ? url : `https://dev-event.vercel.app${url}`,
          tags: ['개발', '컨퍼런스'],
          eventType: detectEventType(title, ['개발']),
          status: 'upcoming',
          crawledAt: new Date().toISOString(),
        })
      }
      return events.slice(0, 20)
    }

    const data = await res.json()
    const eventList = Array.isArray(data) ? data : (data.events || [])

    for (const event of eventList.slice(0, 30)) {
      const title = event.title || event.name || ''
      events.push({
        id: `dev-event-${event.id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId: 'dev-event',
        platform: 'dev-event',
        title,
        description: event.description || '',
        eventDate: event.start_date || event.date || new Date().toISOString(),
        eventEndDate: event.end_date,
        location: event.location || '상세 내용 참조',
        isOnline: event.online || /온라인|zoom|비대면/i.test(title),
        registrationUrl: event.url || event.link || 'https://dev-event.vercel.app',
        organizer: event.organizer,
        cost: event.fee || '정보 없음',
        tags: event.tags || ['개발'],
        eventType: detectEventType(title, event.tags || ['개발']),
        status: 'upcoming',
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`dev-event: crawled ${events.length} events`)
  } catch (error) {
    console.error('dev-event crawl error:', error)
    throw error
  }

  return events
}

// event-us.kr 크롤러
async function crawlEventUs(): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    const html = await fetchWithHeaders('https://event-us.kr/search?category=it-tech')

    // 이벤트 카드 추출
    const cardRegex = /<a[^>]*href="(\/[^"]+)"[^>]*class="[^"]*event-card[^"]*"[^>]*>[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>[\s\S]*?<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/gi

    let match
    while ((match = cardRegex.exec(html)) !== null) {
      const [, urlPath, title, dateStr] = match

      events.push({
        id: `event-us-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId: 'event-us',
        platform: 'event-us',
        title: title.trim(),
        description: '',
        eventDate: parseKoreanDateString(dateStr) || new Date().toISOString(),
        location: '상세 내용 참조',
        isOnline: /온라인|zoom|비대면/i.test(title),
        registrationUrl: `https://event-us.kr${urlPath}`,
        tags: ['IT', '테크'],
        eventType: detectEventType(title, ['IT', '테크']),
        status: 'upcoming',
        crawledAt: new Date().toISOString(),
      })
    }

    // 대체 패턴
    if (events.length === 0) {
      const altRegex = /href="(\/events\/[^"]+)"[^>]*>[\s\S]*?<[^>]*>([^<]{5,100})<\//g
      while ((match = altRegex.exec(html)) !== null) {
        const [, urlPath, title] = match
        if (title && !title.includes('{') && !title.includes('<')) {
          events.push({
            id: `event-us-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sourceId: 'event-us',
            platform: 'event-us',
            title: title.trim(),
            description: '',
            eventDate: new Date().toISOString(),
            location: '상세 내용 참조',
            isOnline: false,
            registrationUrl: `https://event-us.kr${urlPath}`,
            tags: ['IT', '테크'],
            eventType: 'other',
            status: 'upcoming',
            crawledAt: new Date().toISOString(),
          })
        }
      }
    }

    console.log(`event-us: crawled ${events.length} events`)
  } catch (error) {
    console.error('event-us crawl error:', error)
    throw error
  }

  return events.slice(0, 20)
}

// k-startup.go.kr 크롤러
async function crawlKStartup(): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    // AI/플랫폼 관련 프로그램 검색
    const html = await fetchWithHeaders('https://www.k-startup.go.kr/web/contents/list.do?schM=PROGRAM&schBizPbancStr=AI')

    // 프로그램 카드 추출
    const cardRegex = /<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*tit[^"]*"[^>]*>([^<]+)<[\s\S]*?<[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)</gi

    let match
    while ((match = cardRegex.exec(html)) !== null) {
      const [, url, title, dateStr] = match

      events.push({
        id: `k-startup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId: 'k-startup',
        platform: 'k-startup',
        title: title.trim(),
        description: '',
        eventDate: parseKoreanDateString(dateStr) || new Date().toISOString(),
        location: '상세 내용 참조',
        isOnline: /온라인|비대면/i.test(title),
        registrationUrl: url.startsWith('http') ? url : `https://www.k-startup.go.kr${url}`,
        tags: ['스타트업', '지원사업', 'AI'],
        eventType: 'other',
        status: 'upcoming',
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`k-startup: crawled ${events.length} events`)
  } catch (error) {
    console.error('k-startup crawl error:', error)
    // Non-critical, don't throw
  }

  return events.slice(0, 15)
}

// allforyoung.com 크롤러
async function crawlAllForYoung(): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    const html = await fetchWithHeaders('https://www.allforyoung.com/posts/category/contest')

    // 포스트 카드 추출
    const cardRegex = /<a[^>]*href="(\/posts\/[^"]+)"[^>]*>[\s\S]*?<h[234][^>]*>([^<]+)<\/h[234]>[\s\S]*?<span[^>]*>([^<]*\d{4}[^<]*)<\/span>/gi

    let match
    while ((match = cardRegex.exec(html)) !== null) {
      const [, urlPath, title, dateStr] = match

      events.push({
        id: `allforyoung-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId: 'allforyoung',
        platform: 'allforyoung',
        title: title.trim(),
        description: '',
        eventDate: parseKoreanDateString(dateStr) || new Date().toISOString(),
        location: '상세 내용 참조',
        isOnline: /온라인|비대면/i.test(title),
        registrationUrl: `https://www.allforyoung.com${urlPath}`,
        tags: ['청년', '지원사업'],
        eventType: 'other',
        status: 'upcoming',
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`allforyoung: crawled ${events.length} events`)
  } catch (error) {
    console.error('allforyoung crawl error:', error)
    // Non-critical, don't throw
  }

  return events.slice(0, 15)
}

// linkareer.com 크롤러
async function crawlLinkareer(): Promise<EventItem[]> {
  const events: EventItem[] = []

  try {
    const html = await fetchWithHeaders('https://linkareer.com/list/contest?filterBy=CURRENT&orderBy=RECENT')

    // 공모전/이벤트 카드 추출
    const cardRegex = /<a[^>]*href="(\/activity\/[^"]+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<[\s\S]*?<[^>]*class="[^"]*period[^"]*"[^>]*>([^<]+)</gi

    let match
    while ((match = cardRegex.exec(html)) !== null) {
      const [, urlPath, title, periodStr] = match

      events.push({
        id: `linkareer-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId: 'linkareer',
        platform: 'linkareer',
        title: title.trim(),
        description: '',
        eventDate: parseKoreanDateString(periodStr) || new Date().toISOString(),
        location: '상세 내용 참조',
        isOnline: /온라인|비대면/i.test(title),
        registrationUrl: `https://linkareer.com${urlPath}`,
        tags: ['대학생', '취준', '공모전'],
        eventType: 'other',
        status: 'upcoming',
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`linkareer: crawled ${events.length} events`)
  } catch (error) {
    console.error('linkareer crawl error:', error)
    // Non-critical, don't throw
  }

  return events.slice(0, 15)
}

// Helper: Parse Korean date strings
function parseKoreanDateString(dateStr: string): string | null {
  if (!dateStr) return null

  // Pattern: 2024.01.15 or 2024-01-15 or 2024년 1월 15일
  const match = dateStr.match(/(\d{4})[.\-년\s]*(\d{1,2})[.\-월\s]*(\d{1,2})/)
  if (match) {
    const [, year, month, day] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T09:00:00+09:00`
  }

  return null
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
    case 'okky':
      return crawlOkky()
    case 'dev-event':
      return crawlDevEvent()
    case 'event-us':
      return crawlEventUs()
    case 'k-startup':
      return crawlKStartup()
    case 'allforyoung':
      return crawlAllForYoung()
    case 'linkareer':
      return crawlLinkareer()
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
