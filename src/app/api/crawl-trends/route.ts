import { NextRequest, NextResponse } from 'next/server'
import type { NewsTrendItem, NewsTrendPlatform } from '@/types'

interface CrawlError {
  platform: NewsTrendPlatform
  message: string
}

interface CrawlResult {
  items: NewsTrendItem[]
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

// JSON API 요청 헬퍼
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// GeekNews (news.hada.io) 크롤러 - RSS 사용
async function crawlGeekNews(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const rss = await fetchWithHeaders('https://news.hada.io/rss/news')
    console.log(`GeekNews RSS fetched, length: ${rss.length}`)

    // Atom feed 파싱 - 작은따옴표와 큰따옴표 모두 지원
    const entryRegex = /<entry>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<link[^>]*href=['"]([^'"]+)['"][^>]*\/>[\s\S]*?<id>([^<]+)<\/id>[\s\S]*?<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/entry>/g

    let match
    while ((match = entryRegex.exec(rss)) !== null) {
      const [, title, url, id, author] = match
      const topicId = id.match(/id=(\d+)/)?.[1] || Date.now().toString()

      items.push({
        id: `geeknews-${topicId}`,
        platform: 'geeknews',
        title: title.trim(),
        url: url,
        author: author,
        tags: [],
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`GeekNews: crawled ${items.length} items from RSS`)
  } catch (error) {
    console.error('GeekNews crawl error:', error)
    throw error
  }

  return items.slice(0, 30)
}

// Hacker News API 크롤러
async function crawlHackerNews(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    // Top stories ID 목록 가져오기
    const topStoryIds = await fetchJson<number[]>(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    )

    // 상위 30개만 가져오기
    const storyIds = topStoryIds.slice(0, 30)

    // 병렬로 스토리 상세 정보 가져오기 (5개씩 배치)
    for (let i = 0; i < storyIds.length; i += 5) {
      const batch = storyIds.slice(i, i + 5)
      const stories = await Promise.all(
        batch.map(id =>
          fetchJson<{
            id: number
            title: string
            url?: string
            score: number
            descendants?: number
            by: string
            type: string
          }>(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        )
      )

      for (const story of stories) {
        if (story && story.type === 'story' && story.title) {
          items.push({
            id: `hackernews-${story.id}`,
            platform: 'hackernews',
            title: story.title,
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            score: story.score,
            comments: story.descendants,
            author: story.by,
            tags: [],
            crawledAt: new Date().toISOString(),
          })
        }
      }

      // Rate limiting
      if (i + 5 < storyIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`Hacker News: crawled ${items.length} items`)
  } catch (error) {
    console.error('Hacker News crawl error:', error)
    throw error
  }

  return items
}

// Product Hunt API 크롤러 (API 키 필요)
async function crawlProductHunt(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []
  const apiKey = process.env.PRODUCT_HUNT_API_KEY

  if (!apiKey) {
    console.log('Product Hunt: API key not configured, skipping')
    return items
  }

  try {
    // GraphQL API 사용
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          posts(first: 20) {
            edges {
              node {
                id
                name
                tagline
                url
                votesCount
                commentsCount
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }`
      })
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    const posts = data.data?.posts?.edges || []

    for (const { node } of posts) {
      const topics = node.topics?.edges?.map((e: { node: { name: string } }) => e.node.name) || []

      items.push({
        id: `producthunt-${node.id}`,
        platform: 'producthunt',
        title: node.name,
        description: node.tagline,
        url: node.url,
        score: node.votesCount,
        comments: node.commentsCount,
        tags: topics.slice(0, 5),
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`Product Hunt: crawled ${items.length} items`)
  } catch (error) {
    console.error('Product Hunt crawl error:', error)
    throw error
  }

  return items
}

// Disquiet 크롤러 - SPA로 스크래핑 불가, 스킵
async function crawlDisquiet(): Promise<NewsTrendItem[]> {
  console.log('Disquiet: SPA site, skipping (no public API available)')
  return []
}

// eopla.net 크롤러 - SPA로 스크래핑 불가, 스킵
async function crawlEopla(): Promise<NewsTrendItem[]> {
  console.log('Eopla: SPA site, skipping (no public RSS/API available)')
  return []
}

// Reddit JSON API 크롤러
async function crawlReddit(subreddit: string): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    // Reddit .json suffix로 JSON 데이터 가져오기
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=20`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LikeThis/1.0)',
      },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const posts = data?.data?.children || []

    for (const post of posts) {
      const p = post.data
      if (p.stickied) continue // Skip stickied posts

      items.push({
        id: `reddit-${p.id}`,
        platform: 'reddit',
        title: p.title,
        url: p.url.startsWith('http') ? p.url : `https://reddit.com${p.permalink}`,
        description: p.selftext?.substring(0, 200),
        score: p.score,
        comments: p.num_comments,
        author: p.author,
        tags: [subreddit],
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`Reddit r/${subreddit}: crawled ${items.length} items`)
  } catch (error) {
    console.error(`Reddit r/${subreddit} crawl error:`, error)
    // Non-critical, don't throw
  }

  return items
}

// d2.naver.com 크롤러 (네이버 기술 블로그) - RSS 사용
async function crawlD2Naver(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const rss = await fetchWithHeaders('https://d2.naver.com/d2.atom')
    console.log(`D2 Naver RSS fetched, length: ${rss.length}`)

    // Atom feed 파싱
    const entryRegex = /<entry>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<link[^>]*href="([^"]+)"[^>]*\/>[\s\S]*?<id>([^<]+)<\/id>/g

    let match
    while ((match = entryRegex.exec(rss)) !== null) {
      const [, title, url, id] = match
      const postId = url.split('/').pop() || Date.now().toString()

      items.push({
        id: `d2naver-${postId}`,
        platform: 'd2naver',
        title: title.trim(),
        url: url,
        tags: ['네이버', '기술블로그'],
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`D2 Naver: crawled ${items.length} items from RSS`)
  } catch (error) {
    console.error('D2 Naver crawl error:', error)
    // Non-critical, don't throw
  }

  return items.slice(0, 15)
}

// tech.kakao.com 크롤러 (카카오 기술 블로그) - RSS 사용
async function crawlKakaoTech(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const rss = await fetchWithHeaders('https://tech.kakao.com/blog/feed/')
    console.log(`Kakao Tech RSS fetched, length: ${rss.length}`)

    // RSS 파싱
    const itemRegex = /<item>[\s\S]*?<title><!\[CDATA\[([^\]]+)\]\]><\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<dc:creator><!\[CDATA\[([^\]]+)\]\]><\/dc:creator>/g

    let match
    while ((match = itemRegex.exec(rss)) !== null) {
      const [, title, url, author] = match
      const postId = url.split('/').pop() || Date.now().toString()

      items.push({
        id: `kakaotech-${postId}`,
        platform: 'kakaotech',
        title: title.trim(),
        url: url,
        author: author,
        tags: ['카카오', '기술블로그'],
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`Kakao Tech: crawled ${items.length} items from RSS`)
  } catch (error) {
    console.error('Kakao Tech crawl error:', error)
    // Non-critical, don't throw
  }

  return items.slice(0, 15)
}

// velog.io 크롤러 - GraphQL API가 빈 결과 반환, 스킵
async function crawlVelog(): Promise<NewsTrendItem[]> {
  console.log('Velog: GraphQL API not returning data, skipping')
  return []
}

// yozm.wishket.com 크롤러 - SPA로 스크래핑 불가, 스킵
async function crawlYozm(): Promise<NewsTrendItem[]> {
  console.log('Yozm: SPA site, skipping (no public RSS/API available)')
  return []
}

export async function POST(req: NextRequest) {
  try {
    const { platforms } = await req.json() as { platforms?: NewsTrendPlatform[] }

    // 기본: 모든 플랫폼
    const targetPlatforms: NewsTrendPlatform[] = platforms || ['geeknews', 'hackernews', 'producthunt', 'disquiet']

    const result: CrawlResult = {
      items: [],
      errors: [],
    }

    // 각 플랫폼 크롤링
    for (const platform of targetPlatforms) {
      try {
        let items: NewsTrendItem[] = []

        switch (platform) {
          case 'geeknews':
            items = await crawlGeekNews()
            break
          case 'hackernews':
            items = await crawlHackerNews()
            break
          case 'producthunt':
            items = await crawlProductHunt()
            break
          case 'disquiet':
            items = await crawlDisquiet()
            break
          case 'eopla':
            items = await crawlEopla()
            break
          case 'reddit':
            // Multiple subreddits
            const programming = await crawlReddit('programming')
            const ml = await crawlReddit('MachineLearning')
            items = [...programming, ...ml]
            break
          case 'd2naver':
            items = await crawlD2Naver()
            break
          case 'kakaotech':
            items = await crawlKakaoTech()
            break
          case 'velog':
            items = await crawlVelog()
            break
          case 'yozm':
            items = await crawlYozm()
            break
        }

        result.items.push(...items)

        // 플랫폼 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        result.errors.push({
          platform,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // 중복 제거 (ID 기준)
    const uniqueItems = Array.from(
      new Map(result.items.map(item => [item.id, item])).values()
    )

    // 점수 기준 정렬 (높은 순)
    uniqueItems.sort((a, b) => (b.score || 0) - (a.score || 0))

    return NextResponse.json({
      items: uniqueItems,
      errors: result.errors,
      totalCrawled: uniqueItems.length,
      platformsProcessed: targetPlatforms.length,
      crawledAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Crawl trends API error:', error)
    return NextResponse.json(
      { error: 'Failed to crawl trends' },
      { status: 500 }
    )
  }
}
