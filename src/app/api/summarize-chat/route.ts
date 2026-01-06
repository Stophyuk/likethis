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

    // 스마트 분석: 최근 대화는 상세히, 이전 대화는 간단히
    const lines = chatContent.split('\n')
    const totalLines = lines.length
    const recentStart = Math.floor(totalLines * 0.7) // 마지막 30%가 최근 대화

    const previousContent = lines.slice(0, recentStart).join('\n')
    const recentContent = lines.slice(recentStart).join('\n')

    const prompt = `다음은 "${roomName || '오픈채팅방'}" 대화입니다. 총 ${totalLines}개 메시지.

## 분석 방식
- 최근 대화 (마지막 30%): 상세 분석
- 이전 대화 (처음 70%): 간단 요약
- 전체에서 알아둘 만한 핵심 인사이트는 반드시 추출

JSON으로 응답해주세요:
{
  "summary": {
    "period": "대화 기간",
    "messageCount": ${totalLines},
    "activeUsers": ["활발한 참여자 최대 5명"],
    "mainTopics": ["주요 토픽 3-5개"]
  },
  "recentAnalysis": {
    "period": "최근 대화 기간",
    "details": "최근 대화 상세 분석 (3-5문장)"
  },
  "previousSummary": {
    "period": "이전 대화 기간",
    "briefSummary": "이전 대화 한 줄 요약"
  },
  "insights": [
    {
      "title": "인사이트 제목",
      "description": "설명",
      "importance": "high 또는 medium"
    }
  ],
  "recommendations": [
    {
      "type": "질문답변|의견제시|정보공유",
      "context": "맥락",
      "suggestion": "제안",
      "sampleMessage": "예시 메시지"
    }
  ]
}

중요:
1. insights에서 importance가 "high"인 것은 꼭 알아야 할 중요한 정보
2. recommendations는 최근 대화 기준으로 답변 가능한 것들
3. 링크가 공유되었다면 relatedLinks로 포함

=== 이전 대화 (간단 요약용) ===
${previousContent.substring(0, 5000)}

=== 최근 대화 (상세 분석용) ===
${recentContent.substring(0, 10000)}`

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
