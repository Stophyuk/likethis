import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPlatformGuide } from '@/lib/platform-guides'
import { Platform } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { platform, userInterests = [], recentActivity = '' } = await req.json()

    const guide = getPlatformGuide(platform as Platform)
    if (!guide) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const prompt = `
당신은 SNS 커뮤니티 활동 코치입니다.
사용자의 관심사와 플랫폼 특성을 고려하여 오늘 할 구체적인 활동을 추천해주세요.

## 플랫폼: ${guide.name}
${guide.description}

## 사용자 관심사
${userInterests.length > 0 ? userInterests.join(', ') : '1인개발, AI, 사이드프로젝트'}

## 최근 활동
${recentActivity || '없음'}

## 플랫폼 팁
${guide.tips.join('\n')}

## 요청
다음 형식으로 오늘의 추천 활동 2-3개를 JSON으로 반환해주세요:

{
  "recommendations": [
    {
      "action_type": "follow" | "comment" | "like" | "post",
      "reason": "추천 이유 (1줄)",
      "sample_text": "예시 댓글이나 글 (해당되는 경우)",
      "tip": "실행 팁"
    }
  ]
}

구체적이고 실행 가능한 추천을 해주세요.
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
