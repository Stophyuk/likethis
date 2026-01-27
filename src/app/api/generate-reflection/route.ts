import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ReflectionRequest {
  todayStats: {
    totalPureMinutes: number
    totalAiAssistedMinutes: number
    sessionCount: number
    failLogCount: number
  }
  recentSessions?: {
    category: string
    mode: string
    duration: number
    notes?: string
  }[]
  recentFails?: {
    whatTried: string
    whatFailed: string
    whatLearned?: string
  }[]
}

export async function POST(req: NextRequest) {
  try {
    const { todayStats, recentSessions = [], recentFails = [] } = await req.json() as ReflectionRequest

    // Build context from today's activities
    const sessionSummary = recentSessions.length > 0
      ? recentSessions.map(s =>
          `- ${s.category} (${s.mode}): ${Math.round(s.duration / 60)}분${s.notes ? ` - "${s.notes}"` : ''}`
        ).join('\n')
      : '활동 없음'

    const failSummary = recentFails.length > 0
      ? recentFails.map(f =>
          `- 시도: ${f.whatTried}\n  실패: ${f.whatFailed}${f.whatLearned ? `\n  배움: ${f.whatLearned}` : ''}`
        ).join('\n')
      : '기록 없음'

    const centaurRatio = (todayStats.totalPureMinutes + todayStats.totalAiAssistedMinutes) > 0
      ? Math.round((todayStats.totalPureMinutes / (todayStats.totalPureMinutes + todayStats.totalAiAssistedMinutes)) * 100)
      : 0

    const prompt = `당신은 1인 창업가를 위한 코치입니다.
오늘 하루의 활동 데이터를 바탕으로 깊은 성찰을 이끌어낼 수 있는 질문 3개를 생성해주세요.

## 오늘의 요약
- 총 세션: ${todayStats.sessionCount}회
- Pure Mode (AI 없이 사고): ${todayStats.totalPureMinutes}분
- AI Assisted: ${todayStats.totalAiAssistedMinutes}분
- 자립도 (Centaur Ratio): ${centaurRatio}%
- 실패 기록: ${todayStats.failLogCount}개

## 오늘의 세션
${sessionSummary}

## 오늘의 실패 기록
${failSummary}

## 핵심 철학
- "켄타우로스 모델": AI 능력 + 인간 의지의 결합
- "딥워크": AI 없이 스스로 생각하는 시간의 가치
- "Fail-Fast": 빠르게 실패하고, 빠르게 배우기
- "Personal Monopoly": 대체 불가능한 고유 영역 구축

## 요청
1. 오늘의 활동을 돌아보게 하는 질문
2. 배움이나 성장에 대한 질문
3. 내일을 위한 방향성 질문

질문은 예/아니오로 답할 수 없는 열린 질문이어야 합니다.
공감하되 도전적인 톤으로 작성해주세요.

JSON 형식으로 답해주세요:
{ "questions": ["질문1", "질문2", "질문3"] }`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
    console.error('Generate reflection error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reflection questions' },
      { status: 500 }
    )
  }
}
