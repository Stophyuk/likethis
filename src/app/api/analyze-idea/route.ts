import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { IncubatorIdea } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { idea } = (await request.json()) as { idea: IncubatorIdea }

    if (!idea?.rawIdea) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 })
    }

    // Build context from structured prompts
    const structuredContext = [
      idea.problemStatement && `문제 정의: ${idea.problemStatement}`,
      idea.targetAudience && `타겟 고객: ${idea.targetAudience}`,
      idea.uniqueValue && `차별화 포인트: ${idea.uniqueValue}`,
      idea.mvpFeatures && `MVP 기능: ${idea.mvpFeatures}`,
      idea.revenueModel && `수익 모델: ${idea.revenueModel}`,
      idea.biggestRisk && `가장 큰 리스크: ${idea.biggestRisk}`,
    ]
      .filter(Boolean)
      .join('\n')

    const prompt = `당신은 스타트업 멘토이자 1인 창업 전문가입니다.
아래 아이디어를 분석하고 건설적인 피드백을 제공해주세요.

## 아이디어
${idea.rawIdea}

${structuredContext ? `## 추가 정보\n${structuredContext}` : ''}

## 고민 시간
사용자는 이 아이디어에 대해 ${Math.floor(idea.thinkingDuration / 60)}분 동안 스스로 고민했습니다.

---

다음 형식으로 JSON 응답을 제공해주세요:
{
  "strengths": ["강점 1", "강점 2", "강점 3"],
  "weaknesses": ["약점 1", "약점 2", "약점 3"],
  "suggestions": ["제안 1", "제안 2", "제안 3"],
  "nextSteps": ["다음 단계 1", "다음 단계 2", "다음 단계 3"],
  "marketInsight": "시장에 대한 한 문장 인사이트",
  "viabilityScore": 7
}

주의사항:
- 강점은 진짜 차별화될 수 있는 요소를 찾아주세요
- 약점은 솔직하되 건설적으로 작성해주세요
- 제안은 1인 창업가가 실제로 실행 가능한 것으로 해주세요
- 다음 단계는 구체적이고 작은 액션 아이템으로 작성해주세요
- viabilityScore는 1-10 사이 정수로, 1인 창업가 관점에서 실현 가능성을 평가해주세요
- 한국어로 작성해주세요`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '당신은 1인 창업 전문 멘토입니다. 실용적이고 실행 가능한 피드백을 제공합니다. JSON 형식으로만 응답합니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    const feedback = JSON.parse(responseText)

    // Validate required fields
    const validatedFeedback = {
      strengths: feedback.strengths || ['강점을 분석할 수 없습니다'],
      weaknesses: feedback.weaknesses || ['약점을 분석할 수 없습니다'],
      suggestions: feedback.suggestions || ['추가 정보가 필요합니다'],
      nextSteps: feedback.nextSteps || ['아이디어를 더 구체화해주세요'],
      marketInsight: feedback.marketInsight || '시장 분석을 위한 정보가 부족합니다',
      viabilityScore: Math.min(10, Math.max(1, feedback.viabilityScore || 5)),
    }

    return NextResponse.json({ feedback: validatedFeedback })
  } catch (error) {
    console.error('Analyze idea error:', error)
    return NextResponse.json({ error: 'Failed to analyze idea' }, { status: 500 })
  }
}
