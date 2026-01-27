import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchPhilosophyChunks } from '@/lib/philosophy-rag'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { topic, keyPoints, interests, bilingual = false, philosophyMode = false, ventureContext } = await req.json()

    if (!topic || !keyPoints) {
      return NextResponse.json(
        { error: 'topic and keyPoints are required' },
        { status: 400 }
      )
    }

    // Philosophy Mode: search for relevant philosophy context
    let philosophyContext = ''
    if (philosophyMode) {
      try {
        const chunks = await searchPhilosophyChunks(`${topic} ${keyPoints}`, { limit: 3 })
        if (chunks.length > 0) {
          philosophyContext = `\n\n## 철학적 맥락 (Philosophy Mode)\n다음 관점을 참고하여 글에 깊이를 더하세요:\n${chunks.map(c => `- ${c.content}`).join('\n')}`
        }
      } catch (error) {
        console.error('Philosophy search error:', error)
      }
    }

    // Venture context
    const ventureSection = ventureContext ? `\n\n## Venture 맥락\n${ventureContext}` : ''

    // 이중 언어 생성 프롬프트
    const bilingualPrompt = `당신은 SNS 콘텐츠 작가입니다.
주어진 주제와 핵심 내용을 바탕으로 SNS에 공유할 글의 초안을 한국어와 영어 두 버전으로 작성해주세요.

## 주제
${topic}

## 핵심 내용
${keyPoints}

## 작성자 관심사
${interests?.join(', ') || '1인개발, AI, 사이드프로젝트'}${philosophyContext}${ventureSection}

## 요청
- 친근하고 자연스러운 톤으로 작성
- 독자의 관심을 끌 수 있는 도입부
- 핵심 내용을 잘 전달${philosophyMode ? '\n- 철학적 맥락을 자연스럽게 녹여내세요 (인용이 아닌 관점 반영)' : ''}
- 각 언어 300-500자 정도
- 영어는 직역이 아닌 자연스러운 영어 표현으로
- JSON 형식: { "draft": { "ko": "한국어 초안", "en": "English draft" } }`

    // 단일 언어 생성 프롬프트
    const singlePrompt = `당신은 SNS 콘텐츠 작가입니다.
주어진 주제와 핵심 내용을 바탕으로 SNS에 공유할 글의 초안을 작성해주세요.

## 주제
${topic}

## 핵심 내용
${keyPoints}

## 작성자 관심사
${interests?.join(', ') || '1인개발, AI, 사이드프로젝트'}${philosophyContext}${ventureSection}

## 요청
- 친근하고 자연스러운 톤으로 작성
- 독자의 관심을 끌 수 있는 도입부
- 핵심 내용을 잘 전달${philosophyMode ? '\n- 철학적 맥락을 자연스럽게 녹여내세요 (인용이 아닌 관점 반영)' : ''}
- 300-500자 정도
- JSON 형식: { "draft": "초안 내용" }`

    const prompt = bilingual ? bilingualPrompt : singlePrompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
