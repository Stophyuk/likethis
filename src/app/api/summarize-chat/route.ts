import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Vercel 함수 타임아웃 설정 (최대 60초)
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatMessage {
  date: string
  user: string
  message: string
}

interface Insight {
  category: 'command' | 'number' | 'solution' | 'tool' | 'trend' | 'business'
  title: string
  content: string
  tags: string[]
  sourceQuotes?: string[]  // 원본 대화 인용
}

// AI 인사이트 활용 제안
interface ActionableInsight {
  type: 'blog' | 'project' | 'learning' | 'networking'
  title: string
  description: string
  relatedInsightTitles: string[]
}

interface ChunkInsights {
  insights: Insight[]
  resources: Array<{ url: string; description: string }>
  keyTopics: string[]
}

// Generate actionable insights from extracted insights
async function generateActionableInsights(insights: Insight[]): Promise<ActionableInsight[]> {
  if (insights.length === 0) return []

  const insightSummary = insights.map((i, idx) =>
    `${idx + 1}. [${i.category}] ${i.title}: ${i.content}`
  ).join('\n')

  const prompt = `추출된 인사이트를 바탕으로 실행 가능한 제안을 생성하세요.

## 인사이트 목록
${insightSummary}

## 4가지 활용 유형
1. **blog**: 블로그/SNS 글감 (기술 블로그, 링크드인 포스트)
2. **project**: 사이드 프로젝트 아이디어
3. **learning**: 학습 포인트 (공부할 것, 스킬 업)
4. **networking**: 네트워킹 기회 (커뮤니티 활동, 밋업)

## 규칙
- 각 유형별로 1-2개씩 제안 (총 4-8개)
- 실제로 실행 가능하고 구체적인 제안
- 인사이트를 기반으로 한 근거 있는 제안
- relatedInsightTitles에 관련 인사이트 제목 포함

JSON:
{
  "actionable": [
    {
      "type": "blog|project|learning|networking",
      "title": "제목",
      "description": "구체적인 실행 방법",
      "relatedInsightTitles": ["관련 인사이트 제목"]
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.5,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"actionable":[]}')
    return result.actionable || []
  } catch (error) {
    console.error('Failed to generate actionable insights:', error)
    return []
  }
}

// 청크별 인사이트 추출
async function extractChunkInsights(messages: ChatMessage[], chunkIndex: number, totalChunks: number): Promise<ChunkInsights> {
  const chatContent = messages
    .map(m => m.message)
    .join('\n')
    .substring(0, 20000)

  const prompt = `IT/개발자 커뮤니티 대화에서 **유용한 지식과 트렌드**를 추출하세요.
(청크 ${chunkIndex + 1}/${totalChunks})

## 🚫 금지 표현
- "~에 대해 논의/이야기/언급되었다"
- "~에 대한 정보가 공유되었다"
- "다양한 ~가 다루어졌다"

## 📌 추출 대상 (6가지 카테고리)

### 1. command - 명령어/설정
예: "/compact로 컨텍스트 압축", "user-invocable: true 설정"

### 2. number - 수치/가격
예: "Claude Max $100/월", "RAM 최소 24GB", "75% 해고"

### 3. solution - 문제→해결
예: "화면 깨짐 → 전체화면 전환으로 해결"

### 4. tool - 도구 추천/비교
예: "ghostty 터미널 추천", "chrome devtools > playwright"

### 5. trend - 시장/기술 트렌드 ⭐
예: "채용시장 얼어붙음", "AI 경험 없으면 서류 탈락", "오픈코드가 핫함"

### 6. business - 비즈니스/수익 인사이트 ⭐
예: "부업으로 월급보다 더 벌고 있음", "쇼츠 자동화가 수익 보장 안함"

## 📝 예시

입력: "요즘 채용시장 완전 얼었다" "AI 안했다고 하면 패스"
✅ {"category":"trend","title":"개발자 채용 시장","content":"현재 개발자 채용시장이 얼어붙은 상태. AI 경험이 없으면 서류 단계에서 탈락하는 경우가 많음.","tags":["채용","AI"],"sourceQuotes":["요즘 채용시장 완전 얼었다","AI 안했다고 하면 패스"]}

입력: "월급보다 부업으로 더 벌고 있어서"
✅ {"category":"business","title":"부업 수익","content":"바이브코딩으로 부업 시 본업 월급보다 더 많이 버는 사례가 있음.","tags":["부업","수익"],"sourceQuotes":["월급보다 부업으로 더 벌고 있어서"]}

❌ 금지: {"content":"AI 도구 사용 경험이 공유되었다"}

## 추출 원칙
- 구체적 도구명, 수치, 현상을 포함할 것
- 트렌드/비즈니스 인사이트도 적극 추출
- **sourceQuotes 필수**: 인사이트 근거가 된 원본 대화 1-3개 인용
- 메타 설명("논의되었다")은 절대 금지

JSON: {"insights":[{"category":"","title":"","content":"","tags":[],"sourceQuotes":["원본인용"]}],"resources":[{"url":"","description":""}],"keyTopics":[]}

대화:
${chatContent}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
    temperature: 0.3,
  })

  return JSON.parse(completion.choices[0].message.content || '{"insights":[],"resources":[],"keyTopics":[]}')
}

// 인사이트 종합
async function synthesizeInsights(
  chunkInsights: ChunkInsights[],
  totalMessageCount: number
): Promise<Record<string, unknown>> {
  const allInsights = chunkInsights.flatMap(c => c.insights)
  const allResources = chunkInsights.flatMap(c => c.resources || [])
  const allTopics = [...new Set(chunkInsights.flatMap(c => c.keyTopics || []))]

  // 중복 제거
  const uniqueInsights: Insight[] = []
  const seenTitles = new Set<string>()

  for (const insight of allInsights) {
    const normalizedTitle = insight.title?.toLowerCase().trim()
    if (normalizedTitle && !seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle)
      uniqueInsights.push(insight)
    }
  }

  const uniqueResources = allResources.filter((r, i, arr) =>
    r.url && arr.findIndex(x => x.url === r.url) === i
  )

  if (uniqueInsights.length > 0) {
    const prompt = `IT/개발자 커뮤니티 대화에서 추출된 지식들을 정리하세요.
총 ${totalMessageCount.toLocaleString()}개 메시지, ${uniqueInsights.length}개 인사이트.

## 추출된 지식
${uniqueInsights.map((i, idx) => `${idx + 1}. [${i.category}] ${i.title}: ${i.content}${i.sourceQuotes ? ` (원문: "${i.sourceQuotes.join('", "')}")` : ''}`).join('\n')}

## 공유된 자료
${uniqueResources.map(r => `- ${r.url}: ${r.description}`).join('\n')}

## 🚫 금지 표현
"~에 대해 논의/이야기되었다", "정보가 공유되었다", "다양한 ~가 다루어졌다"

## ✅ 작성 규칙
1. **insights**: 중복 병합, 카테고리별 정리
   - command/number/solution/tool: 구체적 값 포함
   - trend/business: 시장 트렌드, 수익 인사이트
   - **sourceQuotes 필수**: 위에 제공된 원문을 그대로 포함
2. **summary**: 핵심 발견 5-7개를 문장으로 나열
   - ❌ "채용시장에 대해 논의되었다"
   - ✅ "채용시장이 얼어붙음, AI 경험 없으면 서류 탈락 많음"
3. **highlights**: 가장 인상적인 인사이트 3개
   - 트렌드, 비즈니스 인사이트 우선

JSON:
{
  "insights": [{"category":"command|number|solution|tool|trend|business","title":"","content":"","tags":[],"sourceQuotes":["원본인용"]}],
  "resources": [{"url":"","title":"","description":""}],
  "summary": "핵심 발견 나열식 (논의되었다 금지)",
  "highlights": ["인상적인 인사이트 3개"],
  "topKeywords": ["키워드 10개"]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 6000,
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return {
      ...result,
      _meta: {
        totalMessages: totalMessageCount,
        rawInsightCount: allInsights.length,
        uniqueInsightCount: uniqueInsights.length,
        model: 'gpt-4o-mini'
      }
    }
  }

  return {
    insights: [],
    summary: '의미있는 인사이트를 찾지 못했습니다.',
    resources: uniqueResources,
    noInsights: true,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { chatContent, roomName, messages } = await req.json()

    let chatMessages: ChatMessage[] = []

    if (messages && Array.isArray(messages)) {
      chatMessages = messages
    } else if (chatContent) {
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
    console.log(`[OpenAI] Analyzing ${totalCount} messages for room: ${roomName}`)

    if (totalCount <= 500) {
      // 500개 이하: 단일 분석
      const chatText = chatMessages.map(m => m.message).join('\n')

      const prompt = `IT/개발자 커뮤니티 대화에서 **유용한 지식과 트렌드**를 추출하세요.

## 🚫 금지 표현
"~에 대해 논의/이야기되었다", "정보가 공유되었다", "다양한 ~가 다루어졌다"

## 📌 6가지 카테고리
1. **command**: 명령어, 설정값 (예: /compact, user-invocable: true)
2. **number**: 가격, 수치 (예: $100/월, 24GB, 75% 해고)
3. **solution**: 문제→해결 (예: 화면 깨짐 → 전체화면으로 해결)
4. **tool**: 도구 추천/비교 (예: ghostty 추천, chrome devtools > playwright)
5. **trend**: 시장/기술 트렌드 ⭐ (예: 채용시장 얼어붙음, AI 경험 필수)
6. **business**: 비즈니스/수익 ⭐ (예: 부업으로 월급보다 더 벌고 있음)

## 📝 예시
"채용시장 완전 얼었다" "AI 안했다고 하면 패스"
✅ {"category":"trend","title":"채용 시장","content":"개발자 채용시장 얼어붙음. AI 경험 없으면 서류 탈락 많음","tags":["채용","AI"],"sourceQuotes":["채용시장 완전 얼었다","AI 안했다고 하면 패스"]}

"월급보다 부업으로 더 벌고 있어서"
✅ {"category":"business","title":"부업 수익","content":"바이브코딩 부업으로 본업 월급보다 더 버는 사례 있음","tags":["부업","수익"],"sourceQuotes":["월급보다 부업으로 더 벌고 있어서"]}

❌ 금지: {"content":"도구 사용 경험이 공유되었다"}

## 추출 원칙
- **sourceQuotes 필수**: 인사이트 근거가 된 원본 대화 1-3개 인용

## JSON
{
  "insights": [{"category":"","title":"","content":"","tags":[],"sourceQuotes":["원본인용"]}],
  "resources": [{"url":"","title":"","description":""}],
  "summary": "핵심 발견 나열 (논의되었다 금지)",
  "highlights": ["인상적인 인사이트 3개"],
  "topKeywords": ["10개"]
}

대화:
${chatText.substring(0, 25000)}`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 6000,
        temperature: 0.3,
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')

      // Generate actionable insights
      const actionable = await generateActionableInsights(result.insights || [])

      return NextResponse.json({
        ...result,
        actionable,
        _meta: {
          totalMessages: totalCount,
          analysisMethod: 'single',
          model: 'gpt-4o-mini'
        }
      })

    } else {
      // 500개 초과: 청크 분석
      const CHUNK_SIZE = 400
      const chunks: ChatMessage[][] = []

      for (let i = 0; i < chatMessages.length; i += CHUNK_SIZE) {
        chunks.push(chatMessages.slice(i, i + CHUNK_SIZE))
      }

      console.log(`[OpenAI] Processing ${chunks.length} chunks...`)

      // 최대 8개 청크 균등 샘플링
      let chunksToAnalyze: ChatMessage[][]
      if (chunks.length <= 8) {
        chunksToAnalyze = chunks
      } else {
        const step = Math.floor(chunks.length / 8)
        chunksToAnalyze = []
        for (let i = 0; i < 8; i++) {
          chunksToAnalyze.push(chunks[Math.min(i * step, chunks.length - 1)])
        }
      }

      console.log(`[OpenAI] Analyzing ${chunksToAnalyze.length} chunks out of ${chunks.length}...`)

      // 순차 처리 (rate limit 방지)
      const chunkInsights: ChunkInsights[] = []
      for (let i = 0; i < chunksToAnalyze.length; i++) {
        console.log(`[OpenAI] Processing chunk ${i + 1}/${chunksToAnalyze.length}...`)
        const result = await extractChunkInsights(chunksToAnalyze[i], i, chunksToAnalyze.length)
        chunkInsights.push(result)

        if (i < chunksToAnalyze.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      const result = await synthesizeInsights(chunkInsights, totalCount)

      // Generate actionable insights
      const actionable = await generateActionableInsights((result.insights as Insight[]) || [])

      return NextResponse.json({
        ...result,
        actionable,
        _meta: {
          ...((result._meta as object) || {}),
          totalChunks: chunks.length,
          chunksAnalyzed: chunksToAnalyze.length,
          analysisMethod: 'chunked',
          model: 'gpt-4o-mini'
        }
      })
    }

  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({
      error: 'Failed to summarize chat',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
