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

// GeekNews (news.hada.io) 크롤러
async function crawlGeekNews(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const html = await fetchWithHeaders('https://news.hada.io/')

    // 뉴스 항목 추출 - topic_row 클래스
    const topicRegex = /<div class="topic_row"[\s\S]*?<a[^>]*href="(\/topic\?id=\d+)"[^>]*>([^<]+)<\/a>[\s\S]*?<span class="topicinfo">([\s\S]*?)<\/span>/g

    let match
    while ((match = topicRegex.exec(html)) !== null) {
      const [, urlPath, title, infoHtml] = match

      // 포인트와 댓글 수 추출
      const pointMatch = infoHtml.match(/(\d+)\s*P/)
      const commentMatch = infoHtml.match(/(\d+)개의 댓글/)

      // 원본 URL 추출
      const originalUrlMatch = html.slice(match.index, match.index + 1000).match(/href="(https?:\/\/[^"]+)"[^>]*target="_blank"/)

      const id = urlPath.match(/id=(\d+)/)?.[1] || Date.now().toString()

      items.push({
        id: `geeknews-${id}`,
        platform: 'geeknews',
        title: title.trim(),
        url: originalUrlMatch?.[1] || `https://news.hada.io${urlPath}`,
        score: pointMatch ? parseInt(pointMatch[1]) : undefined,
        comments: commentMatch ? parseInt(commentMatch[1]) : undefined,
        tags: [],
        crawledAt: new Date().toISOString(),
      })
    }

    // 대체 패턴 - 더 간단한 추출
    if (items.length === 0) {
      const simpleRegex = /<a[^>]*href="\/topic\?id=(\d+)"[^>]*class="topictitle"[^>]*>([^<]+)<\/a>/g
      while ((match = simpleRegex.exec(html)) !== null) {
        const [, id, title] = match
        items.push({
          id: `geeknews-${id}`,
          platform: 'geeknews',
          title: title.trim(),
          url: `https://news.hada.io/topic?id=${id}`,
          tags: [],
          crawledAt: new Date().toISOString(),
        })
      }
    }

    console.log(`GeekNews: crawled ${items.length} items`)
  } catch (error) {
    console.error('GeekNews crawl error:', error)
    throw error
  }

  return items.slice(0, 30) // 최대 30개
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

// Disquiet 크롤러 (HTML 스크래핑)
async function crawlDisquiet(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const html = await fetchWithHeaders('https://disquiet.io/makerlog')

    // 메이커로그 포스트 추출
    const postRegex = /<a[^>]*href="(\/makerlog\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/g

    let match
    while ((match = postRegex.exec(html)) !== null) {
      const [, urlPath, title] = match
      const id = urlPath.split('/').pop() || Date.now().toString()

      items.push({
        id: `disquiet-${id}`,
        platform: 'disquiet',
        title: title.trim(),
        url: `https://disquiet.io${urlPath}`,
        tags: ['메이커'],
        crawledAt: new Date().toISOString(),
      })
    }

    // 대체 패턴
    if (items.length === 0) {
      const altRegex = /class="[^"]*makerlog[^"]*"[\s\S]*?href="([^"]+)"[\s\S]*?>([^<]+)</g
      while ((match = altRegex.exec(html)) !== null) {
        const [, url, title] = match
        if (url && title && title.trim().length > 5) {
          items.push({
            id: `disquiet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            platform: 'disquiet',
            title: title.trim(),
            url: url.startsWith('http') ? url : `https://disquiet.io${url}`,
            tags: ['메이커'],
            crawledAt: new Date().toISOString(),
          })
        }
      }
    }

    console.log(`Disquiet: crawled ${items.length} items`)
  } catch (error) {
    console.error('Disquiet crawl error:', error)
    throw error
  }

  return items.slice(0, 20)
}

// eopla.net 크롤러 (스타트업 뉴스)
async function crawlEopla(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const html = await fetchWithHeaders('https://www.eopla.net/')

    // 뉴스 아이템 추출
    const articleRegex = /<a[^>]*href="(\/[^"]*)"[^>]*>[\s\S]*?<h[23][^>]*>([^<]+)<\/h[23]>/gi

    let match
    while ((match = articleRegex.exec(html)) !== null) {
      const [, urlPath, title] = match
      if (title && title.trim().length > 10) {
        items.push({
          id: `eopla-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          platform: 'eopla',
          title: title.trim(),
          url: `https://www.eopla.net${urlPath}`,
          tags: ['스타트업', '뉴스'],
          crawledAt: new Date().toISOString(),
        })
      }
    }

    console.log(`Eopla: crawled ${items.length} items`)
  } catch (error) {
    console.error('Eopla crawl error:', error)
    // Non-critical, don't throw
  }

  return items.slice(0, 20)
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

// d2.naver.com 크롤러 (네이버 기술 블로그)
async function crawlD2Naver(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const html = await fetchWithHeaders('https://d2.naver.com/helloworld')

    // 포스트 추출
    const postRegex = /<a[^>]*href="(\/helloworld\/\d+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</gi

    let match
    while ((match = postRegex.exec(html)) !== null) {
      const [, urlPath, title] = match
      items.push({
        id: `d2naver-${urlPath.split('/').pop()}`,
        platform: 'd2naver',
        title: title.trim(),
        url: `https://d2.naver.com${urlPath}`,
        tags: ['네이버', '기술블로그'],
        crawledAt: new Date().toISOString(),
      })
    }

    // 대체 패턴
    if (items.length === 0) {
      const altRegex = /href="(\/helloworld\/\d+)"[^>]*>([^<]{10,100})</g
      while ((match = altRegex.exec(html)) !== null) {
        const [, urlPath, title] = match
        items.push({
          id: `d2naver-${urlPath.split('/').pop()}`,
          platform: 'd2naver',
          title: title.trim(),
          url: `https://d2.naver.com${urlPath}`,
          tags: ['네이버', '기술블로그'],
          crawledAt: new Date().toISOString(),
        })
      }
    }

    console.log(`D2 Naver: crawled ${items.length} items`)
  } catch (error) {
    console.error('D2 Naver crawl error:', error)
    // Non-critical, don't throw
  }

  return items.slice(0, 15)
}

// tech.kakao.com 크롤러 (카카오 기술 블로그)
async function crawlKakaoTech(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const html = await fetchWithHeaders('https://tech.kakao.com/blog/')

    // 포스트 추출
    const postRegex = /<a[^>]*href="(https:\/\/tech\.kakao\.com\/[^"]+)"[^>]*>[\s\S]*?<h[234][^>]*>([^<]+)<\/h[234]>/gi

    let match
    while ((match = postRegex.exec(html)) !== null) {
      const [, url, title] = match
      items.push({
        id: `kakaotech-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        platform: 'kakaotech',
        title: title.trim(),
        url,
        tags: ['카카오', '기술블로그'],
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`Kakao Tech: crawled ${items.length} items`)
  } catch (error) {
    console.error('Kakao Tech crawl error:', error)
    // Non-critical, don't throw
  }

  return items.slice(0, 15)
}

// velog.io 크롤러 (GraphQL API 사용)
async function crawlVelog(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    // Velog GraphQL API
    const res = await fetch('https://v2.velog.io/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query trendingPosts($limit: Int, $offset: Int, $timeframe: String) {
            trendingPosts(limit: $limit, offset: $offset, timeframe: $timeframe) {
              id
              title
              short_description
              user {
                username
              }
              url_slug
              likes
              comments_count
              tags
            }
          }
        `,
        variables: {
          limit: 20,
          offset: 0,
          timeframe: 'week',
        },
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    const posts = data?.data?.trendingPosts || []

    for (const post of posts) {
      items.push({
        id: `velog-${post.id}`,
        platform: 'velog',
        title: post.title,
        description: post.short_description,
        url: `https://velog.io/@${post.user.username}/${post.url_slug}`,
        score: post.likes,
        comments: post.comments_count,
        author: post.user.username,
        tags: post.tags || [],
        crawledAt: new Date().toISOString(),
      })
    }

    console.log(`Velog: crawled ${items.length} items`)
  } catch (error) {
    console.error('Velog crawl error:', error)
    // Non-critical, don't throw
  }

  return items
}

// yozm.wishket.com 크롤러 (요즘IT)
async function crawlYozm(): Promise<NewsTrendItem[]> {
  const items: NewsTrendItem[] = []

  try {
    const html = await fetchWithHeaders('https://yozm.wishket.com/magazine/')

    // 아티클 추출
    const articleRegex = /<a[^>]*href="(\/magazine\/detail\/\d+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</gi

    let match
    while ((match = articleRegex.exec(html)) !== null) {
      const [, urlPath, title] = match
      items.push({
        id: `yozm-${urlPath.split('/').pop()}`,
        platform: 'yozm',
        title: title.trim(),
        url: `https://yozm.wishket.com${urlPath}`,
        tags: ['요즘IT', '개발'],
        crawledAt: new Date().toISOString(),
      })
    }

    // 대체 패턴
    if (items.length === 0) {
      const altRegex = /href="(\/magazine\/detail\/\d+)"[^>]*>[\s\S]*?>([^<]{10,100})</g
      while ((match = altRegex.exec(html)) !== null) {
        const [, urlPath, title] = match
        if (!title.includes('<') && !title.includes('{')) {
          items.push({
            id: `yozm-${urlPath.split('/').pop()}`,
            platform: 'yozm',
            title: title.trim(),
            url: `https://yozm.wishket.com${urlPath}`,
            tags: ['요즘IT', '개발'],
            crawledAt: new Date().toISOString(),
          })
        }
      }
    }

    console.log(`Yozm: crawled ${items.length} items`)
  } catch (error) {
    console.error('Yozm crawl error:', error)
    // Non-critical, don't throw
  }

  return items.slice(0, 15)
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
