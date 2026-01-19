import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { TopicSuggestion, TrendAnalysis, Platform } from '@/types'

// Vercel 함수 타임아웃 설정 (최대 60초)
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Gemini 클라이언트 초기화
const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null

interface InsightInput {
  category: string
  title: string
  content: string
  tags: string[]
  roomId: string
  sourceQuotes?: string[]
}

interface GeneratedTopic {
  title: string
  description: string
  angle: string
  keyPoints: string[]
  relatedInsightTitles: string[]
  platforms: string[]
  searchKeywords: string[]
}

// GPT로 글감 생성
async function generateTopicsWithGPT(
  insights: InsightInput[],
  roomNames: Record<string, string>,
  interests: string[]
): Promise<{ topics: GeneratedTopic[]; insightSummary: string }> {
  const insightText = insights
    .slice(0, 50) // 최대 50개 인사이트 사용
    .map((i, idx) => `${idx + 1}. [${i.category}] ${i.title}: ${i.content} (방: ${roomNames[i.roomId] || i.roomId})`)
    .join('\n')

  const prompt = `IT/개발자 커뮤니티에서 수집된 인사이트를 바탕으로 **바로 글쓰기에 활용할 수 있는** 글감 3개를 제안해주세요.

## 수집된 인사이트 (${insights.length}개)
${insightText}

## 사용자 관심사
${interests.length > 0 ? interests.join(', ') : '없음'}

## 글감 제안 기준
1. **시의성**: 현재 IT/개발자 커뮤니티에서 화제가 되는 주제
2. **차별화**: 기존 글들과 다른 독특한 관점이나 앵글
3. **실용성**: 독자가 바로 활용할 수 있는 정보
4. **스토리텔링**: 개인 경험이나 사례를 녹일 수 있는 주제

## 중요: 실제 글쓰기용 핵심 내용 형식
keyPoints는 반드시 아래 형식으로 작성해주세요. 사용자가 이걸 복사해서 바로 글을 쓸 수 있어야 합니다:
- 각 포인트는 "- " 로 시작
- 구체적인 내용, 수치, 예시 포함
- 5-7개의 상세한 포인트
- 글의 흐름을 따라가는 순서로 배치

예시:
- 도입: 최근 OOO 트렌드가 화제인 이유 (구체적 수치나 사례)
- 핵심 인사이트 1: XXX 현상의 원인 분석
- 내 경험/사례: 실제로 적용해본 결과
- 실용적 팁: 바로 써먹을 수 있는 방법 3가지
- 주의할 점: 흔히 하는 실수들
- 마무리: 앞으로의 전망과 제안

## JSON 응답
{
  "topics": [
    {
      "title": "글 제목 (클릭하고 싶은, 구체적인 제목)",
      "description": "이 글에서 다룰 내용 요약 (2-3문장, 독자가 기대할 수 있는 것)",
      "angle": "차별화 포인트 (왜 이 글을 읽어야 하는지)",
      "keyPoints": [
        "- 도입: 구체적인 도입부 내용",
        "- 본론1: 첫 번째 핵심 포인트 (수치/사례 포함)",
        "- 본론2: 두 번째 핵심 포인트",
        "- 경험담: 개인 경험이나 사례를 넣을 부분",
        "- 실용 팁: 독자가 바로 활용할 수 있는 내용",
        "- 마무리: 결론 및 CTA"
      ],
      "relatedInsightTitles": ["참고한 인사이트 제목들"],
      "platforms": ["medium", "naver", "linkedin"],
      "searchKeywords": ["트렌드 검색용 키워드 3개"]
    }
  ],
  "insightSummary": "전체 인사이트 요약 (2-3문장)"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.7,
  })

  return JSON.parse(completion.choices[0].message.content || '{"topics":[],"insightSummary":""}')
}

// Gemini Grounding으로 트렌드 검색
async function searchTrendsWithGemini(
  keywords: string[],
  topic: string
): Promise<TrendAnalysis | null> {
  if (!genAI) {
    console.log('[Gemini] API key not configured, skipping trend search')
    return null
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      // @ts-expect-error - Grounding tool type not fully defined
      tools: [{ googleSearch: {} }],
    })

    const prompt = `다음 주제에 대한 최근 1개월 내 IT/개발자 커뮤니티 트렌드를 검색해 분석해주세요.

주제: ${topic}
검색 키워드: ${keywords.join(', ')}

다음 정보를 JSON으로 반환해주세요:
{
  "currentTrends": ["현재 관련 트렌드 키워드 또는 토픽 3개"],
  "communityBuzz": "커뮤니티에서 이 주제가 어떻게 논의되고 있는지 2-3문장으로 요약",
  "recentArticles": ["최근 관련 글/뉴스/포스트 제목 3개 (있다면)"],
  "suggestedHook": "이 주제로 글을 시작할 때 사용할 수 있는 훅 문장 1개"
}

JSON만 반환하세요.`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // JSON 추출 (마크다운 코드블록 제거)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log('[Gemini] Could not extract JSON from response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      ...parsed,
      searchedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Gemini] Trend search error:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { insights, roomNames, interests = [] } = await req.json()

    if (!insights || insights.length === 0) {
      return NextResponse.json(
        { error: '인사이트가 없습니다. 먼저 카톡방에서 인사이트를 추출해주세요.' },
        { status: 400 }
      )
    }

    console.log(`[GenerateTopics] Processing ${insights.length} insights from ${Object.keys(roomNames).length} rooms`)

    // 1. GPT로 글감 생성
    console.log('[GenerateTopics] Generating topics with GPT...')
    const { topics: generatedTopics, insightSummary } = await generateTopicsWithGPT(
      insights,
      roomNames,
      interests
    )

    if (!generatedTopics || generatedTopics.length === 0) {
      return NextResponse.json(
        { error: '글감 생성에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 2. 각 글감에 대해 Gemini로 트렌드 검색 (병렬 처리)
    console.log('[GenerateTopics] Searching trends with Gemini...')
    const trendResults = await Promise.all(
      generatedTopics.map(topic =>
        searchTrendsWithGemini(topic.searchKeywords, topic.title)
      )
    )

    // 3. 결과 병합
    const topics: TopicSuggestion[] = generatedTopics.map((topic, index) => {
      // 관련 인사이트 찾기
      const relatedInsights = topic.relatedInsightTitles
        .map(title => {
          const insight = insights.find((i: InsightInput) =>
            i.title.toLowerCase().includes(title.toLowerCase()) ||
            title.toLowerCase().includes(i.title.toLowerCase())
          )
          if (insight) {
            return {
              title: insight.title,
              content: insight.content,
              roomName: roomNames[insight.roomId] || insight.roomId,
            }
          }
          return null
        })
        .filter(Boolean) as TopicSuggestion['relatedInsights']

      return {
        id: `topic_${Date.now()}_${index}`,
        title: topic.title,
        description: topic.description,
        angle: topic.angle,
        keyPoints: topic.keyPoints,
        relatedInsights,
        trendAnalysis: trendResults[index] || undefined,
        platforms: topic.platforms as Platform[],
        searchKeywords: topic.searchKeywords,
      }
    })

    return NextResponse.json({
      topics,
      insightSummary,
      generatedAt: new Date().toISOString(),
      _meta: {
        insightsUsed: insights.length,
        roomsUsed: Object.keys(roomNames),
        geminiEnabled: !!genAI,
        trendsFound: trendResults.filter(Boolean).length,
      },
    })
  } catch (error) {
    console.error('[GenerateTopics] Error:', error)
    return NextResponse.json(
      {
        error: '글감 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
