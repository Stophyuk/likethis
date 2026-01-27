import OpenAI from 'openai'
import { createServerClient, isSupabaseConfigured, PhilosophyChunk } from './supabase/client'
import { vibeCodingBlocks, termTranslations } from './vibe-coding-content'
import type { ContentBlock } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SearchResult {
  blockId: string
  theme: string
  title: string
  content: string
  keywords: string[]
  similarity: number
  source: 'vector' | 'keyword'
}

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

/**
 * Search philosophy chunks using vector similarity (Supabase)
 */
async function vectorSearch(
  query: string,
  threshold: number = 0.5,
  limit: number = 5
): Promise<SearchResult[]> {
  const supabase = createServerClient()
  if (!supabase) {
    return []
  }

  try {
    const embedding = await generateEmbedding(query)

    const { data, error } = await supabase.rpc('match_philosophy_chunks', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      console.error('Vector search error:', error)
      return []
    }

    return (data || []).map((chunk: PhilosophyChunk & { similarity: number }) => ({
      blockId: chunk.block_id,
      theme: chunk.theme,
      title: chunk.title,
      content: chunk.content,
      keywords: chunk.keywords,
      similarity: chunk.similarity,
      source: 'vector' as const,
    }))
  } catch (error) {
    console.error('Vector search failed:', error)
    return []
  }
}

/**
 * Fallback keyword-based search using local content
 */
function keywordSearch(query: string, limit: number = 5): SearchResult[] {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)

  // Score each block based on keyword matches
  const scored = vibeCodingBlocks.map(block => {
    let score = 0

    // Check title match
    if (block.title.toLowerCase().includes(queryLower)) {
      score += 10
    }

    // Check keyword matches
    for (const keyword of block.targetKeywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 5
      }
      for (const word of queryWords) {
        if (keyword.toLowerCase().includes(word)) {
          score += 2
        }
      }
    }

    // Check key points matches
    for (const point of block.keyPoints) {
      const pointLower = point.toLowerCase()
      for (const word of queryWords) {
        if (pointLower.includes(word)) {
          score += 1
        }
      }
    }

    // Check examples matches
    for (const example of block.examples) {
      const exampleLower = example.toLowerCase()
      for (const word of queryWords) {
        if (exampleLower.includes(word)) {
          score += 0.5
        }
      }
    }

    return { block, score }
  })

  // Sort by score and take top results
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      blockId: s.block.id,
      theme: s.block.theme,
      title: s.block.title,
      content: formatBlockContent(s.block),
      keywords: s.block.targetKeywords,
      similarity: Math.min(s.score / 20, 1), // Normalize to 0-1
      source: 'keyword' as const,
    }))
}

/**
 * Format a content block into readable text
 */
function formatBlockContent(block: ContentBlock): string {
  const parts = [
    `# ${block.title}`,
    '',
    '## 핵심 포인트',
    ...block.keyPoints.map(p => `- ${p}`),
    '',
    '## 예시',
    ...block.examples.map(e => `- ${e}`),
  ]
  return parts.join('\n')
}

/**
 * Search philosophy chunks - uses vector search if available, falls back to keyword
 */
export async function searchPhilosophyChunks(
  query: string,
  options: {
    threshold?: number
    limit?: number
    preferVector?: boolean
  } = {}
): Promise<SearchResult[]> {
  const { threshold = 0.5, limit = 5, preferVector = true } = options

  // Try vector search first if Supabase is configured
  if (preferVector && isSupabaseConfigured) {
    const vectorResults = await vectorSearch(query, threshold, limit)
    if (vectorResults.length > 0) {
      return vectorResults
    }
  }

  // Fall back to keyword search
  return keywordSearch(query, limit)
}

/**
 * Build RAG context from search results
 */
export function buildRAGContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return ''
  }

  const context = results.map((r, i) => {
    return `[${i + 1}] ${r.title} (${r.theme})
${r.content}
---`
  }).join('\n\n')

  return `## 관련 철학적 맥락

다음은 바이브코딩과 1인 창업가를 위한 철학에서 관련된 내용입니다:

${context}`
}

/**
 * Get term translations for non-developers
 */
export function getTermTranslations(): Record<string, string> {
  return termTranslations
}

/**
 * Translate tech terms in text to non-developer friendly language
 */
export function translateTechTerms(text: string): string {
  let result = text

  for (const [term, translation] of Object.entries(termTranslations)) {
    // Create a regex that matches the term as a whole word (case-insensitive)
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    result = result.replace(regex, `${term}(${translation})`)
  }

  return result
}

/**
 * Generate translated content with philosophy context
 */
export async function generateMuseContent(
  newsContent: string,
  options: {
    targetAudience?: 'general' | 'entrepreneur'
    includePhilosophy?: boolean
    translateTerms?: boolean
  } = {}
): Promise<{
  translatedContent: string
  philosophyContext: string
  relatedBlocks: SearchResult[]
  translatedTerms: string[]
}> {
  const {
    targetAudience = 'general',
    includePhilosophy = true,
    translateTerms = true,
  } = options

  // Search for related philosophy content
  const relatedBlocks = includePhilosophy
    ? await searchPhilosophyChunks(newsContent, { limit: 3 })
    : []

  const philosophyContext = buildRAGContext(relatedBlocks)

  // Find which terms need translation
  const usedTerms: string[] = []
  const newsLower = newsContent.toLowerCase()
  for (const term of Object.keys(termTranslations)) {
    if (newsLower.includes(term.toLowerCase())) {
      usedTerms.push(term)
    }
  }

  // Build prompt
  const audienceContext = targetAudience === 'entrepreneur'
    ? '1인 창업가 또는 사이드 프로젝트를 고려하는 사람'
    : '기술에 익숙하지 않은 일반인'

  const prompt = `당신은 기술 뉴스를 비개발자도 이해할 수 있게 "번역"하는 전문가입니다.

## 원본 뉴스/기술 트렌드
${newsContent}

${philosophyContext}

## 번역할 기술 용어
${usedTerms.map(t => `- ${t}: ${termTranslations[t]}`).join('\n')}

## 타겟 독자
${audienceContext}

## 요청
1. 위 내용을 타겟 독자가 이해할 수 있도록 "번역"해주세요
2. 기술 용어는 쉬운 말로 바꾸거나 괄호 안에 설명을 추가하세요
3. ${includePhilosophy ? '관련 철학적 맥락이 있다면 자연스럽게 연결해주세요' : '핵심 내용만 전달하세요'}
4. 이것이 왜 중요한지, 어떤 기회가 있는지 설명해주세요
5. 300-500자로 작성해주세요

JSON 형식으로 답해주세요:
{
  "translatedContent": "번역된 내용",
  "keyTakeaway": "핵심 시사점 (1-2문장)",
  "opportunity": "비개발자에게 어떤 기회가 있는지 (1-2문장)"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No response from AI')
  }

  const result = JSON.parse(content)

  return {
    translatedContent: result.translatedContent,
    philosophyContext: result.keyTakeaway + (result.opportunity ? `\n\n💡 ${result.opportunity}` : ''),
    relatedBlocks,
    translatedTerms: usedTerms,
  }
}
