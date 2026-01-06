import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chatContent, roomName } = await req.json()

    if (!chatContent) {
      return NextResponse.json({ error: 'Chat content is required' }, { status: 400 })
    }

    const prompt = `다음은 "${roomName || '카카오톡'}" 오픈채팅방 대화입니다.

분석 후 JSON으로 응답해주세요:

{
  "summary": {
    "period": "대화 기간 (예: 1월 3일 ~ 1월 5일)",
    "messageCount": 유효메시지수,
    "activeUsers": ["활발한 참여자 최대 5명"],
    "mainTopics": ["주요 토픽 3-5개"]
  },
  "insights": [
    {
      "title": "인사이트 제목",
      "description": "구체적 설명 (2-3문장)",
      "relatedLinks": ["대화에서 공유된 관련 링크"]
    }
  ],
  "recommendations": [
    {
      "type": "질문답변",
      "context": "어떤 질문/상황에 대해",
      "suggestion": "이렇게 참여하면 좋겠다",
      "sampleMessage": "실제로 보낼 수 있는 예시 메시지"
    }
  ]
}

효율적으로 분석해서:
1. 핵심 내용만 요약
2. 내가 얻을 수 있는 인사이트 추출 (유용한 정보, 팁, 트렌드)
3. 참여할 수 있는 방법 + 구체적 답변 예시 제안

대화 내용:
---
${chatContent.substring(0, 15000)}
---`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ error: 'Failed to summarize chat' }, { status: 500 })
  }
}
