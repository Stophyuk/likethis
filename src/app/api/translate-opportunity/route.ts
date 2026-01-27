import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { NewsTrendItem } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items: NewsTrendItem[] }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    // Prepare trend summaries
    const trendSummaries = items
      .slice(0, 10)
      .map((item, i) => `${i + 1}. [${item.platform}] ${item.title}${item.description ? `: ${item.description}` : ''}`)
      .join('\n')

    const prompt = `당신은 기술 트렌드를 비개발자가 이해할 수 있는 기회로 번역하는 전문가입니다.

## 현재 기술 트렌드
${trendSummaries}

## 요청
위 기술 트렌드를 비개발자(마케터, 기획자, 콘텐츠 크리에이터, 1인 창업가 등)가 활용할 수 있는 기회로 번역해주세요.

다음 형식의 JSON으로 응답해주세요:
{
  "summary": "전체 트렌드 요약 (비개발자 관점, 2-3문장)",
  "opportunities": [
    {
      "title": "기회 제목",
      "forWhom": "누구를 위한 기회인지 (예: 콘텐츠 크리에이터, 마케터)",
      "description": "이 기회가 무엇인지 쉽게 설명",
      "actionItems": ["구체적 행동 1", "구체적 행동 2"],
      "difficulty": "easy" | "medium" | "hard",
      "timeframe": "즉시 가능 | 1주일 | 1개월"
    }
  ],
  "glossary": [
    {
      "term": "기술 용어",
      "simple": "쉬운 설명"
    }
  ],
  "contentIdeas": [
    {
      "topic": "콘텐츠 주제",
      "angle": "차별화 포인트",
      "targetAudience": "타겟 청중"
    }
  ]
}

주의사항:
- 기술 용어를 최대한 쉬운 말로 바꿔주세요
- 실제로 실행 가능한 구체적인 기회를 제시해주세요
- 개발 지식 없이도 시작할 수 있는 것 위주로
- 한국어로 작성해주세요`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 기술 트렌드를 비개발자가 이해하고 활용할 수 있도록 번역하는 전문가입니다. JSON 형식으로만 응답합니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(responseText)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Translate opportunity error:', error)
    return NextResponse.json({ error: 'Failed to translate opportunities' }, { status: 500 })
  }
}
