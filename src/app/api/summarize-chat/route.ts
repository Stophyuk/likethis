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

    const prompt = `다음은 "${roomName || '카카오톡'}" 오픈채팅방 대화입니다.

스마트 분석 방식으로 응답해주세요:
- 최근 대화 (마지막 30%): 상세 분석
- 이전 대화 (처음 70%): 간단 요약
- 전체에서 핵심 인사이트는 반드시 추출

JSON으로 응답:
{
  "recentAnalysis": {
    "period": "최근 대화 기간 (예: 1월 5일)",
    "messageCount": 숫자,
    "activeUsers": ["활발한 참여자 최대 5명"],
    "mainTopics": ["주요 토픽 3-5개"],
    "details": "상세 분석 내용 (3-5문장으로 주요 논의 사항, 분위기, 핵심 발언 등)"
  },
  "previousSummary": {
    "period": "이전 대화 기간 (예: 1월 3일 ~ 1월 4일)",
    "messageCount": 숫자,
    "briefSummary": "한 줄 요약 (핵심 내용만)"
  },
  "keyInsights": [
    {
      "title": "인사이트 제목",
      "description": "구체적 설명 (2-3문장)",
      "importance": "high 또는 medium",
      "relatedLinks": ["대화에서 공유된 관련 링크"]
    }
  ],
  "recommendations": [
    {
      "type": "질문답변|의견제시|정보공유",
      "context": "어떤 질문/상황에 대해",
      "suggestion": "이렇게 참여하면 좋겠다",
      "sampleMessage": "실제로 보낼 수 있는 예시 메시지"
    }
  ]
}

분석 지침:
1. keyInsights의 importance가 "high"인 것은 놓치면 안 되는 중요 정보
2. recommendations는 실제로 대화에 참여할 수 있는 구체적 방법 제시
3. 이전 대화가 없거나 짧으면 previousSummary는 null 가능

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
