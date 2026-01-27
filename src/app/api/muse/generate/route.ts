import { NextRequest, NextResponse } from 'next/server'
import { generateMuseContent, getTermTranslations } from '@/lib/philosophy-rag'

export async function POST(req: NextRequest) {
  try {
    const {
      newsContent,
      targetAudience = 'general',
      includePhilosophy = true,
      translateTerms = true,
    } = await req.json()

    if (!newsContent) {
      return NextResponse.json(
        { error: 'newsContent is required' },
        { status: 400 }
      )
    }

    const result = await generateMuseContent(newsContent, {
      targetAudience,
      includePhilosophy,
      translateTerms,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Muse generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate translated content' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve term translations
export async function GET() {
  try {
    const translations = getTermTranslations()
    return NextResponse.json({ translations })
  } catch (error) {
    console.error('Get translations error:', error)
    return NextResponse.json(
      { error: 'Failed to get translations' },
      { status: 500 }
    )
  }
}
