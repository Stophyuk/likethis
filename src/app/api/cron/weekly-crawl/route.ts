import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron으로 호출되는 주간 크롤링 엔드포인트
// 매주 월요일 오전 9시(UTC) = 한국시간 18시
export async function GET(req: NextRequest) {
  try {
    // Vercel Cron 인증 확인
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('Cron: Unauthorized request')
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('Weekly crawl started at:', new Date().toISOString())

    const results = {
      trends: { success: false, count: 0, error: '' },
      timestamp: new Date().toISOString(),
    }

    // 트렌드 크롤링
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

      const trendsResponse = await fetch(`${baseUrl}/api/crawl-trends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: ['geeknews', 'hackernews', 'producthunt', 'disquiet']
        }),
      })

      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        results.trends.success = true
        results.trends.count = trendsData.totalCrawled || 0
        console.log('Trends crawled:', results.trends.count)
      } else {
        results.trends.error = `HTTP ${trendsResponse.status}`
      }
    } catch (error) {
      results.trends.error = error instanceof Error ? error.message : 'Unknown error'
      console.error('Trends crawl error:', error)
    }

    console.log('Weekly crawl completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Weekly crawl completed',
      results,
    })

  } catch (error) {
    console.error('Weekly crawl error:', error)
    return NextResponse.json(
      { error: 'Weekly crawl failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Vercel Cron은 기본적으로 GET만 지원
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 최대 60초
