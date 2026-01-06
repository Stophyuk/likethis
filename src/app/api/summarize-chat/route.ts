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

    const prompt = `
다음은 "${roomName || '카카오톡'}" 오픈채팅방의 대화 내용입니다.
이 내용을 분석하여 다음 형식의 JSON으로 요약해주세요:

{
  "summary": "전체 요약 (2-3문장)",
  "hot_topics": [
    { "topic": "핫한 토픽1", "links": ["관련 링크들"] }
  ],
  "announcements": ["공지사항이나 중요 알림"],
  "action_items": [
    {
      "type": "참여추천" | "답변필요" | "확인필요",
      "description": "설명",
      "target": "대상 (있으면)"
    }
  ],
  "extracted_links": ["대화에서 추출한 모든 링크들"]
}

대화 내용:
---
${chatContent.substring(0, 10000)}
---

핵심 정보를 놓치지 말고, 참여하면 좋을 토론이나 질문도 찾아주세요.
`

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
