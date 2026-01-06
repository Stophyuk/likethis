import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { topic, keyPoints, interests } = await req.json()

    if (!topic || !keyPoints) {
      return NextResponse.json(
        { error: 'topic and keyPoints are required' },
        { status: 400 }
      )
    }

    const prompt = `당신은 SNS 콘텐츠 작가입니다.
주어진 주제와 핵심 내용을 바탕으로 SNS에 공유할 글의 초안을 작성해주세요.

## 주제
${topic}

## 핵심 내용
${keyPoints}

## 작성자 관심사
${interests?.join(', ') || '1인개발, AI, 사이드프로젝트'}

## 요청
- 친근하고 자연스러운 톤으로 작성
- 독자의 관심을 끌 수 있는 도입부
- 핵심 내용을 잘 전달
- 300-500자 정도
- JSON 형식: { "draft": "초안 내용" }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    const result = JSON.parse(content)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate draft error:', error)
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    )
  }
}
