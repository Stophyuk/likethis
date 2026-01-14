import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { TrendItem } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { items, context } = await req.json() as { items: TrendItem[]; context?: string }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Trend items are required' }, { status: 400 })
    }

    // 트렌드 아이템들을 텍스트로 변환
    const trendsText = items.map((item, i) => {
      const source = item.source === 'kakao' ? '카카오톡' : item.source === 'community' ? '커뮤니티' : '수동입력'
      return `${i + 1}. [${source}] ${item.content}\n   키워드: ${item.keywords.join(', ')}`
    }).join('\n\n')

    const prompt = `다음은 수집된 트렌드 정보입니다. 분석하여 콘텐츠 제작에 활용할 수 있는 인사이트를 제공해주세요.

## 트렌드 정보 (${items.length}개)
${trendsText}

${context ? `## 추가 맥락\n${context}\n` : ''}

JSON으로 응답해주세요:
{
  "summary": "전체 트렌드 요약 (2-3문장)",
  "hotTopics": [
    {
      "topic": "주목할 토픽",
      "description": "설명",
      "contentIdeas": ["콘텐츠 아이디어 1", "콘텐츠 아이디어 2"]
    }
  ],
  "keywords": {
    "trending": ["상승 키워드들"],
    "recommended": ["추천 키워드들"]
  },
  "contentSuggestions": [
    {
      "platform": "x|medium|youtube|naver|instagram",
      "title": "제안 콘텐츠 제목",
      "hook": "시작 문장/훅",
      "angle": "접근 방식"
    }
  ],
  "timing": "콘텐츠 게시 타이밍 제안"
}

중요:
1. hotTopics는 3-5개, 가장 주목할 만한 것 위주
2. contentSuggestions는 각 플랫폼에 맞는 스타일로 2-3개
3. 실제로 활용 가능한 구체적인 제안`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json({
      ...result,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Summarize trends error:', error)
    return NextResponse.json({ error: 'Failed to summarize trends' }, { status: 500 })
  }
}
