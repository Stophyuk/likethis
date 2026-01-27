import { NextRequest, NextResponse } from 'next/server'
import { searchPhilosophyChunks } from '@/lib/philosophy-rag'

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5, threshold = 0.5 } = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    const results = await searchPhilosophyChunks(query, {
      limit,
      threshold,
    })

    return NextResponse.json({
      results,
      count: results.length,
      searchMethod: results[0]?.source || 'none',
    })
  } catch (error) {
    console.error('Philosophy search error:', error)
    return NextResponse.json(
      { error: 'Failed to search philosophy chunks' },
      { status: 500 }
    )
  }
}
