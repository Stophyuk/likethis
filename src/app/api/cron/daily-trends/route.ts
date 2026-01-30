import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Vercel cron job: runs daily at 00:00 UTC (09:00 KST)
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the crawl-trends API internally
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/crawl-trends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platforms: ['geeknews', 'hackernews', 'producthunt', 'disquiet', 'eopla', 'reddit', 'd2naver', 'kakaotech', 'velog', 'yozm']
      }),
    })

    if (!res.ok) {
      throw new Error(`Crawl failed: ${res.status}`)
    }

    const data = await res.json()

    // Store results to a global cache collection for all users
    if (adminDb) {
      await adminDb.collection('globalCache').doc('dailyTrends').set({
        items: data.items,
        crawledAt: new Date().toISOString(),
        totalCrawled: data.totalCrawled,
        errors: data.errors,
      })
    }

    return NextResponse.json({
      success: true,
      totalCrawled: data.totalCrawled,
      crawledAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily trends cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
