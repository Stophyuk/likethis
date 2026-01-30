import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { NewsTrendItem, WeeklyTrendAnalysis } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: NewsTrendItem[] }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items to analyze' }, { status: 400 })
    }

    // Get the date range
    const dates = items.map(i => new Date(i.crawledAt)).sort((a, b) => a.getTime() - b.getTime())
    const periodStart = dates[0]?.toISOString() || new Date().toISOString()
    const periodEnd = dates[dates.length - 1]?.toISOString() || new Date().toISOString()

    // Prepare items for analysis (limit to avoid token overflow)
    const itemsForAnalysis = items.slice(0, 100).map(item => ({
      title: item.title,
      platform: item.platform,
      score: item.score,
      tags: item.tags,
      description: item.description?.substring(0, 200),
    }))

    const prompt = `당신은 기술 트렌드 분석 전문가입니다. 아래는 최근 7일간 수집된 기술 뉴스 및 트렌드 데이터입니다.

이 데이터를 분석하여 다음을 도출해주세요:

1. **종합 요약** (summary): 이번 주 기술 트렌드의 전반적인 흐름을 2-3문장으로 요약

2. **핫토픽** (hotTopics): 가장 많이 언급되거나 주목받은 주제 3-5개
   - topic: 토픽 이름
   - description: 간단한 설명
   - frequency: 언급 빈도 (1-10)
   - sources: 관련 플랫폼들

3. **인사이트** (insights): 실질적인 인사이트 3개
   - title: 인사이트 제목
   - description: 상세 설명
   - actionItems: 구체적인 액션 아이템 2-3개

4. **추천 액션** (recommendedActions): 콘텐츠 창작자/개발자를 위한 추천 액션 3개
   - action: 구체적인 액션
   - platform: 추천 플랫폼 (블로그, 트위터, 유튜브 등)
   - reason: 이유

5. **키워드** (keywords):
   - trending: 현재 뜨고 있는 키워드 5-7개
   - emerging: 앞으로 주목할 신흥 키워드 3-5개

분석 대상 데이터:
${JSON.stringify(itemsForAnalysis, null, 2)}

JSON 형식으로만 응답해주세요. 마크다운 코드블록 없이 순수 JSON만 반환하세요.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a tech trend analyst. Respond only in valid JSON format without markdown code blocks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || '{}'

    // Parse JSON (handle potential markdown code blocks)
    let analysisData
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysisData = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse analysis response:', content)
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 })
    }

    const analysis: WeeklyTrendAnalysis = {
      id: `analysis-${Date.now()}`,
      summary: analysisData.summary || '',
      hotTopics: analysisData.hotTopics || [],
      insights: analysisData.insights || [],
      recommendedActions: analysisData.recommendedActions || [],
      keywords: analysisData.keywords || { trending: [], emerging: [] },
      analyzedAt: new Date().toISOString(),
      periodStart,
      periodEnd,
      totalItemsAnalyzed: items.length,
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Weekly trend analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
