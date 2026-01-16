import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 커뮤니티별 톤 & 스타일 가이드
const COMMUNITY_STYLES: Record<string, string> = {
  'reddit': '캐주얼하고 친근한 톤. 약간의 유머 OK. 자기 홍보는 피하고 진정성 있게.',
  'hackernews': '기술적이고 간결한 톤. 핵심만 전달. 논리적인 의견 제시.',
  'twitter': '짧고 임팩트 있게. 280자 이내. 해시태그는 최소화.',
  'linkedin': '전문적이고 인사이트 중심. 경험 공유나 배운 점 언급.',
  'disquiet': '스타트업/프로덕트 커뮤니티. 건설적인 피드백, 응원, 경험 공유.',
  'producthunt': '제품에 대한 칭찬과 건설적 피드백 균형. 구체적인 사용 경험 언급.',
  'naver': '네이버 블로그/카페 스타일. 정중하고 친근한 톤.',
  'youtube': '영상 내용에 대한 감상. 구체적인 포인트 언급. 긍정적 톤.',
  'instagram': '짧고 친근하게. 이모지 적절히 활용.',
  'general': '일반적인 온라인 커뮤니티. 정중하고 건설적인 톤.',
}

export async function POST(req: NextRequest) {
  try {
    const { community, postContent, postUrl, commentTone, userContext } = await req.json()

    if (!community || !postContent) {
      return NextResponse.json(
        { error: 'community and postContent are required' },
        { status: 400 }
      )
    }

    const styleGuide = COMMUNITY_STYLES[community] || COMMUNITY_STYLES['general']

    const prompt = `당신은 온라인 커뮤니티 댓글 작성 전문가입니다.
주어진 게시글에 달면 좋을 댓글을 추천해주세요.

## 커뮤니티
${community}

## 커뮤니티 스타일 가이드
${styleGuide}

## 원하는 댓글 톤
${commentTone || '친근하고 건설적인'}

${postUrl ? `## 게시글 URL\n${postUrl}\n` : ''}

## 게시글 내용
${postContent}

${userContext ? `## 추가 컨텍스트 (댓글 작성자 정보)\n${userContext}\n` : ''}

## 요청
1. 게시글 내용을 분석하고
2. 해당 커뮤니티에 적합한 댓글 3개를 추천해주세요
3. 각 댓글은 다른 접근 방식으로 (공감, 질문, 정보 추가 등)

JSON 형식으로 반환:
{
  "postSummary": "게시글 요약 (1-2문장)",
  "comments": [
    {
      "type": "댓글 유형 (공감/질문/정보추가/경험공유/칭찬/피드백)",
      "content": "추천 댓글 내용",
      "reason": "이 댓글이 좋은 이유"
    }
  ],
  "tips": ["이 커뮤니티에서 댓글 달 때 팁"]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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
    console.error('Generate comment error:', error)
    return NextResponse.json(
      { error: 'Failed to generate comment suggestions' },
      { status: 500 }
    )
  }
}
