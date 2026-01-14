import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { EventItem } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface EventWithRecommendation extends EventItem {
  recommendation: {
    score: number // 1-10
    verdict: 'must-go' | 'recommended' | 'optional' | 'skip'
    reason: string
    insights: string[]
  }
}

interface RecommendRequest {
  events: EventItem[]
  userProfile: {
    interests: string[] // 사용자 관심사
    role?: string // 직업/역할 (예: 개발자, 창업가)
    goals?: string[] // 목표 (예: 네트워킹, 학습, 투자유치)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { events, userProfile } = await req.json() as RecommendRequest

    if (!events || events.length === 0) {
      return NextResponse.json({ error: 'events array is required' }, { status: 400 })
    }

    // 이벤트 정보를 간결하게 정리
    const eventSummaries = events.slice(0, 20).map((e, i) => ({
      index: i,
      title: e.title,
      description: e.description?.substring(0, 150) || '',
      date: e.eventDate,
      location: e.location,
      cost: e.cost || '정보 없음',
      tags: e.tags.join(', '),
    }))

    const prompt = `당신은 스타트업/테크 이벤트 큐레이터입니다. 사용자의 프로필을 기반으로 각 이벤트의 가치를 평가해주세요.

## 사용자 프로필
- 관심사: ${userProfile.interests?.join(', ') || '스타트업, 테크, AI'}
- 역할: ${userProfile.role || '스타트업 관계자'}
- 목표: ${userProfile.goals?.join(', ') || '네트워킹, 인사이트 획득'}

## 이벤트 목록
${JSON.stringify(eventSummaries, null, 2)}

## 평가 기준
1. **관련성**: 사용자 관심사와 얼마나 관련있는가
2. **네트워킹 가치**: 유의미한 인맥을 만들 수 있는가
3. **인사이트**: 새로운 지식이나 트렌드를 얻을 수 있는가
4. **시간 대비 가치**: 투자 시간 대비 얻을 것이 있는가
5. **희소성**: 자주 열리지 않는 특별한 기회인가

## 응답 형식 (JSON)
{
  "recommendations": [
    {
      "index": 0,
      "score": 8,
      "verdict": "must-go",
      "reason": "한 줄 이유",
      "insights": ["얻을 수 있는 것 1", "얻을 수 있는 것 2"]
    }
  ]
}

verdict 기준:
- must-go (8-10점): 꼭 가야 함, 놓치면 아까움
- recommended (6-7점): 추천, 시간 되면 가볼만
- optional (4-5점): 선택적, 특별히 관심있으면
- skip (1-3점): 패스, 시간 낭비 가능성

각 이벤트에 대해 솔직하게 평가해주세요. 모든 이벤트를 추천할 필요 없습니다.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // 추천 결과를 이벤트에 매핑
    const recommendedEvents: EventWithRecommendation[] = events.slice(0, 20).map((event, i) => {
      const rec = result.recommendations?.find((r: { index: number }) => r.index === i) || {
        score: 5,
        verdict: 'optional',
        reason: '분석 중',
        insights: [],
      }

      return {
        ...event,
        recommendation: {
          score: rec.score,
          verdict: rec.verdict,
          reason: rec.reason,
          insights: rec.insights || [],
        },
      }
    })

    // 점수순 정렬
    recommendedEvents.sort((a, b) => b.recommendation.score - a.recommendation.score)

    return NextResponse.json({
      events: recommendedEvents,
      summary: {
        mustGo: recommendedEvents.filter(e => e.recommendation.verdict === 'must-go').length,
        recommended: recommendedEvents.filter(e => e.recommendation.verdict === 'recommended').length,
        optional: recommendedEvents.filter(e => e.recommendation.verdict === 'optional').length,
        skip: recommendedEvents.filter(e => e.recommendation.verdict === 'skip').length,
      },
    })

  } catch (error) {
    console.error('Recommend API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
