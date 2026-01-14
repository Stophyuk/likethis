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

// 청크 요약 결과
interface ChunkSummary {
  period: string
  mainTopics: string[]
  keyInsights: string[]
  activeUsers: string[]
  importantMessages: string[]
}

// 청크별 간단 요약 (빠른 처리)
async function summarizeChunk(messages: ChatMessage[], chunkIndex: number, totalChunks: number): Promise<ChunkSummary> {
  const chatContent = messages
    .map(m => `[${m.date}] ${m.user}: ${m.message}`)
    .join('\n')
    .substring(0, 15000) // 청크당 15000자

  const prompt = `다음은 총 ${totalChunks}개 청크 중 ${chunkIndex + 1}번째 대화입니다. (${messages.length}개 메시지)

핵심만 추출해서 JSON으로 응답:
{
  "period": "이 청크의 대화 기간 (예: 1월 10일 ~ 1월 12일)",
  "mainTopics": ["이 구간의 주요 토픽 3-5개"],
  "keyInsights": ["꼭 알아야 할 중요 정보/결정/공지 등 최대 5개"],
  "activeUsers": ["이 구간에서 활발한 사용자 최대 5명"],
  "importantMessages": ["핵심 메시지 원문 최대 3개 (중요한 공지, 결정사항 등)"]
}

대화 내용:
${chatContent}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

// 청크 요약들을 종합하여 최종 분석
async function synthesizeSummaries(
  chunkSummaries: ChunkSummary[],
  recentMessages: ChatMessage[],
  roomName: string,
  totalMessageCount: number
): Promise<Record<string, unknown>> {
  // 청크 요약 정리
  const allTopics = chunkSummaries.flatMap(c => c.mainTopics)
  const allInsights = chunkSummaries.flatMap(c => c.keyInsights)
  const allUsers = chunkSummaries.flatMap(c => c.activeUsers)
  const allImportantMessages = chunkSummaries.flatMap(c => c.importantMessages)

  // 최근 대화 텍스트 (상세 분석용)
  const recentContent = recentMessages
    .map(m => `[${m.date}] ${m.user}: ${m.message}`)
    .join('\n')
    .substring(0, 20000)

  const prompt = `"${roomName || '오픈채팅방'}" 대화를 분석합니다. 총 ${totalMessageCount}개 메시지.

## 전체 대화에서 추출된 정보

### 전체 기간 토픽들:
${[...new Set(allTopics)].join(', ')}

### 전체 기간 핵심 인사이트들:
${allInsights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

### 활발한 참여자들:
${[...new Set(allUsers)].join(', ')}

### 중요 메시지들:
${allImportantMessages.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}

## 최근 대화 (상세 분석 대상):
${recentContent}

---

위 정보를 바탕으로 종합 분석 결과를 JSON으로:
{
  "summary": {
    "period": "전체 대화 기간",
    "messageCount": ${totalMessageCount},
    "activeUsers": ["가장 활발한 참여자 최대 5명 - 위 정보에서 빈도순"],
    "mainTopics": ["전체 기간 주요 토픽 5-7개 - 중요도순"]
  },
  "recentAnalysis": {
    "period": "최근 대화 기간",
    "details": "최근 대화 상세 분석 (5-7문장, 구체적인 내용과 맥락 포함)"
  },
  "previousSummary": {
    "period": "이전 대화 기간",
    "briefSummary": "이전 전체 대화 요약 (3-4문장, 핵심 흐름과 주요 결정사항)"
  },
  "insights": [
    {
      "title": "인사이트 제목 (구체적으로)",
      "description": "상세 설명 (2-3문장)",
      "importance": "high 또는 medium",
      "source": "관련 원본 메시지나 맥락"
    }
  ],
  "recommendations": [
    {
      "type": "질문답변|의견제시|정보공유|팔로업",
      "context": "이 추천이 나온 맥락",
      "suggestion": "구체적인 제안",
      "sampleMessage": "보낼 수 있는 예시 메시지"
    }
  ],
  "keyDecisions": ["대화에서 나온 중요한 결정/합의 사항들"],
  "pendingItems": ["아직 결론나지 않은 논의/질문들"],
  "sharedResources": ["공유된 링크, 파일, 자료 등"]
}

중요:
1. insights는 최소 5개, 중요한 것부터
2. recommendations는 최근 대화 기준 3-5개
3. 모든 내용은 구체적이고 actionable하게
4. 빈 배열은 피하고, 해당 없으면 적절한 기본값`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
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
        .map(m => `[${m.date}] ${m.user}: ${m.message}`)
        .join('\n')

      const recentStart = Math.floor(totalCount * 0.7)
      const previousContent = chatText.split('\n').slice(0, recentStart).join('\n')
      const recentContent = chatText.split('\n').slice(recentStart).join('\n')

      const prompt = `다음은 "${roomName || '오픈채팅방'}" 대화입니다. 총 ${totalCount}개 메시지.

JSON으로 응답:
{
  "summary": {
    "period": "대화 기간",
    "messageCount": ${totalCount},
    "activeUsers": ["활발한 참여자 최대 5명"],
    "mainTopics": ["주요 토픽 3-5개"]
  },
  "recentAnalysis": {
    "period": "최근 대화 기간",
    "details": "최근 대화 상세 분석 (5-7문장)"
  },
  "previousSummary": {
    "period": "이전 대화 기간",
    "briefSummary": "이전 대화 요약 (2-3문장)"
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

=== 이전 대화 ===
${previousContent.substring(0, 8000)}

=== 최근 대화 ===
${recentContent.substring(0, 15000)}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      return NextResponse.json(result)

    } else {
      // 500개 초과: 청크 분석 후 종합
      const CHUNK_SIZE = 500
      const chunks: ChatMessage[][] = []

      for (let i = 0; i < chatMessages.length; i += CHUNK_SIZE) {
        chunks.push(chatMessages.slice(i, i + CHUNK_SIZE))
      }

      console.log(`Processing ${chunks.length} chunks...`)

      // 청크별 병렬 분석 (최근 3개 청크는 항상 분석, 나머지는 샘플링)
      const chunksToAnalyze = chunks.length <= 5
        ? chunks
        : [
            ...chunks.slice(0, 2), // 처음 2개
            ...chunks.slice(-3),   // 마지막 3개
          ]

      const chunkSummaries = await Promise.all(
        chunksToAnalyze.map((chunk, idx) =>
          summarizeChunk(chunk, idx, chunksToAnalyze.length)
        )
      )

      // 최근 메시지 (마지막 30% 또는 최대 1000개)
      const recentCount = Math.min(Math.floor(totalCount * 0.3), 1000)
      const recentMessages = chatMessages.slice(-recentCount)

      // 종합 분석
      const result = await synthesizeSummaries(
        chunkSummaries,
        recentMessages,
        roomName,
        totalCount
      )

      return NextResponse.json({
        ...result,
        _meta: {
          totalMessages: totalCount,
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
