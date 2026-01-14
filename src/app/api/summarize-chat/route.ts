import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  date: string
  user: string
  message: string
}

// 인사이트 타입
interface Insight {
  category: 'tech' | 'business' | 'resource' | 'tip'
  title: string
  content: string
  tags: string[]
}

// 청크별 인사이트 추출
interface ChunkInsights {
  insights: Insight[]
  resources: string[]
}

// 청크별 인사이트 추출 (기술/비즈니스 중심)
async function extractChunkInsights(messages: ChatMessage[], chunkIndex: number, totalChunks: number): Promise<ChunkInsights> {
  const chatContent = messages
    .map(m => m.message)  // 누가 말했는지 제외, 내용만
    .join('\n')
    .substring(0, 15000)

  const prompt = `당신은 기술 및 비즈니스 리서처입니다.
다음은 총 ${totalChunks}개 청크 중 ${chunkIndex + 1}번째 대화입니다.

이 대화에서 참고하거나 배울 만한 인사이트만 추출하세요.

추출 대상:
1. 기술 트렌드: 바이브 코딩, AI 도구, 개발 방법론, 새로운 기술
2. 유용한 팁: 코딩 팁, 생산성 향상법, 도구 사용법
3. 비즈니스 인사이트: 시장 동향, 사업 기회, 업계 소식
4. 추천 자료: 공유된 링크, 추천 책/강의/도구

중요:
- 무의미한 잡담은 무시하세요
- 누가 말했는지, 언제 말했는지는 생략하세요
- 핵심 내용만 간결하게 정리하세요
- 인사이트가 없으면 빈 배열로 응답하세요

JSON 형식:
{
  "insights": [
    {
      "category": "tech | business | resource | tip",
      "title": "핵심 제목 (10자 이내)",
      "content": "상세 내용 (1-2문장)",
      "tags": ["관련", "태그들"]
    }
  ],
  "resources": ["발견된 URL이나 자료명"]
}

대화 내용:
${chatContent}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  })

  return JSON.parse(completion.choices[0].message.content || '{"insights":[],"resources":[]}')
}

// 청크 인사이트들을 종합
async function synthesizeInsights(
  chunkInsights: ChunkInsights[],
  totalMessageCount: number
): Promise<Record<string, unknown>> {
  // 모든 인사이트 합치기
  const allInsights = chunkInsights.flatMap(c => c.insights)
  const allResources = [...new Set(chunkInsights.flatMap(c => c.resources))]

  // 중복 인사이트 제거 (제목 기준)
  const uniqueInsights: Insight[] = []
  const seenTitles = new Set<string>()

  for (const insight of allInsights) {
    const normalizedTitle = insight.title.toLowerCase().trim()
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle)
      uniqueInsights.push(insight)
    }
  }

  // 인사이트들을 GPT로 정리/병합
  if (uniqueInsights.length > 0) {
    const prompt = `다음 인사이트들을 정리하고 중복을 병합해주세요.

인사이트 목록:
${uniqueInsights.map((i, idx) => `${idx + 1}. [${i.category}] ${i.title}: ${i.content}`).join('\n')}

JSON 형식으로 응답:
{
  "insights": [
    {
      "category": "tech | business | resource | tip",
      "title": "핵심 제목",
      "content": "상세 내용 (1-2문장)",
      "tags": ["태그들"]
    }
  ],
  "summary": "전체 대화의 핵심 요약 (2-3문장, 구체적인 내용 위주)"
}

중요:
- 비슷한 내용은 하나로 병합
- 카테고리별로 정리
- 가장 유용한 인사이트 순으로 정렬
- 무의미한 내용은 제외`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      ...result,
      resources: allResources,
      _meta: {
        totalMessages: totalMessageCount,
        rawInsightCount: allInsights.length,
        uniqueInsightCount: uniqueInsights.length,
      }
    }
  }

  return {
    insights: [],
    summary: '의미있는 인사이트를 찾지 못했습니다.',
    resources: allResources,
    noInsights: true,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { chatContent, roomName, messages } = await req.json()

    // messages 배열이 직접 전달되면 사용, 아니면 chatContent 파싱
    let chatMessages: ChatMessage[] = []

    if (messages && Array.isArray(messages)) {
      chatMessages = messages
    } else if (chatContent) {
      // 기존 텍스트 형식 지원 (하위 호환)
      const lines = chatContent.split('\n').filter((l: string) => l.trim())
      chatMessages = lines.map((line: string) => {
        const match = line.match(/\[([^\]]+)\]\s*([^:]+):\s*(.+)/)
        if (match) {
          return { date: match[1], user: match[2], message: match[3] }
        }
        return { date: '', user: '', message: line }
      })
    }

    if (chatMessages.length === 0) {
      return NextResponse.json({ error: 'Chat content is required' }, { status: 400 })
    }

    const totalCount = chatMessages.length
    console.log(`Analyzing ${totalCount} messages for room: ${roomName}`)

    // 메시지 수에 따른 분석 전략 결정
    if (totalCount <= 500) {
      // 500개 이하: 단일 분석
      const chatText = chatMessages
        .map(m => m.message)  // 내용만 사용
        .join('\n')

      const prompt = `당신은 기술 및 비즈니스 리서처입니다.
다음 대화에서 참고하거나 배울 만한 인사이트만 추출하세요.

추출 대상:
1. 기술 트렌드: 바이브 코딩, AI 도구, 개발 방법론, 새로운 기술
2. 유용한 팁: 코딩 팁, 생산성 향상법, 도구 사용법
3. 비즈니스 인사이트: 시장 동향, 사업 기회, 업계 소식
4. 추천 자료: 공유된 링크, 추천 책/강의/도구

중요:
- 무의미한 잡담은 무시하세요
- 누가 말했는지, 언제 말했는지는 생략하세요
- 핵심 내용만 간결하게 정리하세요
- 인사이트가 없으면 빈 배열로 응답하세요

JSON 형식:
{
  "insights": [
    {
      "category": "tech | business | resource | tip",
      "title": "핵심 제목",
      "content": "상세 내용 (1-2문장)",
      "tags": ["관련", "태그들"]
    }
  ],
  "summary": "전체 대화 핵심 요약 (2-3문장, 구체적인 내용 위주)",
  "resources": ["발견된 URL이나 자료명"]
}

대화 내용:
${chatText.substring(0, 25000)}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 3000,
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      return NextResponse.json({
        ...result,
        _meta: {
          totalMessages: totalCount,
          analysisMethod: 'single',
        }
      })

    } else {
      // 500개 초과: 청크 분석 후 종합
      const CHUNK_SIZE = 500
      const chunks: ChatMessage[][] = []

      for (let i = 0; i < chatMessages.length; i += CHUNK_SIZE) {
        chunks.push(chatMessages.slice(i, i + CHUNK_SIZE))
      }

      console.log(`Processing ${chunks.length} chunks for insights...`)

      // 청크별 병렬 분석 (최대 5개 청크 샘플링)
      const chunksToAnalyze = chunks.length <= 5
        ? chunks
        : [
            ...chunks.slice(0, 2), // 처음 2개
            ...chunks.slice(-3),   // 마지막 3개
          ]

      const chunkInsights = await Promise.all(
        chunksToAnalyze.map((chunk, idx) =>
          extractChunkInsights(chunk, idx, chunksToAnalyze.length)
        )
      )

      // 종합 분석
      const result = await synthesizeInsights(chunkInsights, totalCount)

      return NextResponse.json({
        ...result,
        _meta: {
          ...((result._meta as object) || {}),
          chunksAnalyzed: chunksToAnalyze.length,
          analysisMethod: 'chunked',
        }
      })
    }

  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ error: 'Failed to summarize chat' }, { status: 500 })
  }
}
