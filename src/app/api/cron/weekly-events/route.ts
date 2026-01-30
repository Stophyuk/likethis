import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import type { EventSource } from '@/types'

// Default event sources for weekly crawl
const DEFAULT_SOURCES: EventSource[] = [
  { id: 'okky-events', platform: 'okky', name: 'OKKY 세미나/컨퍼런스', url: 'https://okky.kr/events', keywords: ['세미나', '컨퍼런스'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-seminar', platform: 'onoffmix', name: '세미나', url: 'https://onoffmix.com/event?s=세미나', keywords: ['세미나'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-conference', platform: 'onoffmix', name: '컨퍼런스', url: 'https://onoffmix.com/event?s=컨퍼런스', keywords: ['컨퍼런스'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-startup', platform: 'onoffmix', name: '스타트업', url: 'https://onoffmix.com/event?s=스타트업', keywords: ['스타트업'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-ai', platform: 'onoffmix', name: 'AI/인공지능', url: 'https://onoffmix.com/event?s=AI', keywords: ['AI', '인공지능'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-developer', platform: 'onoffmix', name: '개발자', url: 'https://onoffmix.com/event?s=개발자', keywords: ['개발', '코딩'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'onoffmix-tech', platform: 'onoffmix', name: '테크', url: 'https://onoffmix.com/event?s=테크', keywords: ['테크', 'tech'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'meetup-tech', platform: 'meetup', name: 'Seoul Tech', url: 'https://www.meetup.com/find/?location=kr--Seoul&source=EVENTS&keywords=tech', keywords: ['tech'], isActive: true, createdAt: new Date().toISOString() },
  // Additional sources
  { id: 'dev-event', platform: 'custom', name: 'dev-event', url: 'https://dev-event.vercel.app', keywords: ['개발', '컨퍼런스'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'event-us', platform: 'custom', name: 'event-us', url: 'https://event-us.kr', keywords: ['IT', '테크'], isActive: true, createdAt: new Date().toISOString() },
]

// Vercel cron job: runs weekly on Monday at 00:00 UTC (09:00 KST)
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call the crawl-events API internally
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/crawl-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: DEFAULT_SOURCES }),
    })

    if (!res.ok) {
      throw new Error(`Crawl failed: ${res.status}`)
    }

    const data = await res.json()

    // Store results to a global cache collection for all users
    if (adminDb) {
      await adminDb.collection('globalCache').doc('weeklyEvents').set({
        events: data.events,
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
    console.error('Weekly events cron error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
