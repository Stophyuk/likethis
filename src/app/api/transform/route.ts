import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPlatformGuide } from '@/lib/platform-guides'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { content, targetPlatform, contentType = 'text', bilingual = false } = await req.json()

    if (!content || !targetPlatform) {
      return NextResponse.json({ error: 'Content and target platform are required' }, { status: 400 })
    }

    const guide = getPlatformGuide(targetPlatform)
    if (!guide) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    const platformGuidelines = `
${targetPlatform === 'x' ? '- 280자 이내 (영어) 또는 140자 이내 (한글)\n- 간결하고 임팩트 있게\n- 해시태그 2-3개' : ''}
${targetPlatform === 'linkedin' ? '- 전문적인 톤\n- 인사이트 중심\n- 줄바꿈 활용' : ''}
${targetPlatform === 'medium' ? '- 서론/본론/결론 구조\n- 소제목 활용\n- 개인 경험 추가' : ''}
${targetPlatform === 'instagram' ? '- 첫 줄에 후킹\n- 이모지 활용\n- 해시태그 10-15개 (마지막에)' : ''}
${targetPlatform === 'reddit' ? '- TL;DR 포함\n- 커뮤니티 친화적 톤\n- 자기 홍보 최소화' : ''}
`

    // 이중 언어 변환 프롬프트
    const bilingualPrompt = `
다음 콘텐츠를 ${guide.name} 플랫폼에 맞게 한국어와 영어 두 버전으로 변환해주세요.

## 플랫폼 특성
- ${guide.description}
${guide.hashtagSuggestions ? `- 추천 해시태그: ${guide.hashtagSuggestions.join(', ')}` : ''}

## 플랫폼별 가이드라인
${platformGuidelines}

## 원본 콘텐츠
${content}

## 요청
- 한국어와 영어 각각 플랫폼에 맞게 최적화
- 영어는 직역이 아닌 자연스러운 표현으로
- 해시태그도 각 언어에 맞게 별도로

다음 JSON 형식으로 반환해주세요:
{
  "ko": {
    "transformed_content": "한국어 변환 콘텐츠",
    "hashtags": ["한국어해시태그1", "한국어해시태그2"],
    "tips": ["한국어 팁"],
    "character_count": 123
  },
  "en": {
    "transformed_content": "English transformed content",
    "hashtags": ["EnglishHashtag1", "EnglishHashtag2"],
    "tips": ["English tip"],
    "character_count": 123
  }
}
`

    // 단일 언어 변환 프롬프트
    const singlePrompt = `
다음 콘텐츠를 ${guide.name} 플랫폼에 맞게 변환해주세요.

## 플랫폼 특성
- ${guide.description}
${guide.hashtagSuggestions ? `- 추천 해시태그: ${guide.hashtagSuggestions.join(', ')}` : ''}

## 플랫폼별 가이드라인
${platformGuidelines}

## 원본 콘텐츠
${content}

## 요청
다음 JSON 형식으로 반환해주세요:
{
  "transformed_content": "변환된 콘텐츠",
  "hashtags": ["해시태그1", "해시태그2"],
  "tips": ["이 플랫폼에서 더 좋은 반응을 얻기 위한 팁"],
  "character_count": 123
}
`

    const prompt = bilingual ? bilingualPrompt : singlePrompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return NextResponse.json(result)
  } catch (error) {
    console.error('Transform error:', error)
    return NextResponse.json({ error: 'Failed to transform content' }, { status: 500 })
  }
}
