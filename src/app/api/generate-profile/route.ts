import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPlatformGuide } from '@/lib/platform-guides'
import type { UserProfileInfo, Platform } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { userInfo, platforms } = await req.json() as {
      userInfo: UserProfileInfo
      platforms: Platform[]
    }

    if (!userInfo || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'userInfo and platforms are required' },
        { status: 400 }
      )
    }

    const platformDetails = platforms.map(p => {
      const guide = getPlatformGuide(p)
      return {
        platform: p,
        name: guide?.name || p,
        description: guide?.description || '',
      }
    })

    const prompt = `당신은 SNS 프로필 최적화 전문가입니다.
사용자 정보를 바탕으로 각 플랫폼에 맞는 프로필 바이오, 사진 팁, 링크 추천을 제공해주세요.

## 사용자 정보
- 이름: ${userInfo.name}
- 역할/직업: ${userInfo.role}
- 전문분야: ${userInfo.expertise.join(', ')}
- 목표 청중: ${userInfo.targetAudience}
- 목표: ${userInfo.goals}

## 대상 플랫폼
${platformDetails.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## 요청
각 플랫폼별로 다음을 제공해주세요:
1. bio: 메인 바이오 문구 (플랫폼 글자 제한 고려)
2. bioAlternatives: 대안 바이오 문구 2개
3. profilePhotoTips: 프로필 사진 팁 2-3개
4. headerImageTips: 헤더/배경 이미지 팁 2-3개
5. linkRecommendations: 프로필에 넣을 링크 추천 2-3개

플랫폼별 특성:
- X (Twitter): 160자 제한, 간결하고 임팩트 있게
- LinkedIn: 전문성 강조, 키워드 활용
- Instagram: 150자 제한, 이모지 활용, CTA 포함
- Medium: 작가 소개 느낌, 스토리텔링
- Reddit: 커뮤니티 친화적, 겸손한 톤

JSON 형식으로 반환:
{
  "recommendations": [
    {
      "platform": "플랫폼코드",
      "bio": "메인 바이오",
      "bioAlternatives": ["대안1", "대안2"],
      "profilePhotoTips": ["팁1", "팁2"],
      "headerImageTips": ["팁1", "팁2"],
      "linkRecommendations": ["추천1", "추천2"]
    }
  ]
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
    console.error('Generate profile error:', error)
    return NextResponse.json(
      { error: 'Failed to generate profile recommendations' },
      { status: 500 }
    )
  }
}
