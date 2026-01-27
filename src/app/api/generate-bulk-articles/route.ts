import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  BulkArticleRequest,
  BulkArticleResponse,
  GeneratedArticle,
  ContentFactoryPlatform,
} from '@/types';
import { getBlockById, termTranslations } from '@/lib/vibe-coding-content';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Platform-specific constraints and styles
const platformConfig: Record<ContentFactoryPlatform, {
  maxLength: number;
  style: string;
  hashtagCount: number;
}> = {
  x: {
    maxLength: 280,
    style: '짧고 임팩트 있게. 핵심 한 문장 + 호기심 유발',
    hashtagCount: 2,
  },
  linkedin: {
    maxLength: 3000,
    style: '전문적이면서 개인 경험 중심. 첫 줄에 강력한 훅. 줄바꿈 많이 사용',
    hashtagCount: 5,
  },
  naver: {
    maxLength: 5000,
    style: '친근하고 읽기 쉽게. 소제목 활용. 실용적인 정보 강조',
    hashtagCount: 10,
  },
  medium: {
    maxLength: 8000,
    style: '심도 있는 분석과 스토리텔링. 서론-본론-결론 구조',
    hashtagCount: 5,
  },
};

// Non-developer friendly writing guidelines
const nonDevGuidelines = `
## 비개발자 친화적 글쓰기 원칙

1. **전문용어 → 일상 비유**
${Object.entries(termTranslations).map(([term, translation]) => `   - "${term}" → "${translation}"`).join('\n')}

2. **"그래서 뭐?" 테스트**
   - 모든 기술 설명 후 "이게 나한테 왜 중요한데?"에 답변 필수
   - 추상적 개념 → 구체적 영향으로 전환

3. **구체적 숫자로**
   - "빠르다" → "기존 3개월 → 3일로 단축"
   - "많이" → "75%가", "10명 중 7명이"

4. **경험담 형식**
   - "~라고 합니다" → "제가 직접 해보니..."
   - "전문가들은 말한다" → "실제로 겪어보면..."

5. **공감 포인트 활용**
   - 불안: "나만 뒤처지는 거 아닐까"
   - 희망: "나도 할 수 있겠다"
   - 호기심: "진짜? 어떻게?"
`;

export async function POST(req: NextRequest) {
  try {
    const body: BulkArticleRequest = await req.json();
    const {
      insights,
      selectedBlocks,
      targetPlatforms,
      targetAudience,
      articleCount = 5,
    } = body;

    if (!insights || insights.length === 0) {
      return NextResponse.json(
        { error: 'At least one insight is required' },
        { status: 400 }
      );
    }

    // Get selected content blocks
    const blocks = selectedBlocks
      .map(id => getBlockById(id))
      .filter(Boolean);

    // Prepare context for generation
    const insightsContext = insights
      .map((i, idx) => `[인사이트 ${idx + 1}] ${i.title}: ${i.content}${i.sourceQuotes?.length ? ` (원문: "${i.sourceQuotes.slice(0, 2).join('", "')}")` : ''}`)
      .join('\n');

    const blocksContext = blocks
      .map(b => `[${b!.theme}] ${b!.title}\n핵심: ${b!.keyPoints.join(' / ')}\n예시: ${b!.examples.join(' / ')}`)
      .join('\n\n');

    const audienceContext = targetAudience === 'general'
      ? nonDevGuidelines
      : '개발자 대상: 기술 용어 사용 가능, 실무적 관점 강조';

    // Generate articles
    const prompt = `당신은 IT/개발 트렌드를 일반인도 쉽게 이해할 수 있게 설명하는 콘텐츠 전문가입니다.

## 소스 자료

### 카카오톡 커뮤니티에서 추출한 인사이트
${insightsContext}

### 바이브코딩 보고서 핵심 내용
${blocksContext}

## 타겟 독자
${audienceContext}

## 생성 요청
위 인사이트와 보고서 내용을 조합하여 **${articleCount}개**의 커뮤니티 글감을 생성하세요.

각 글감마다:
1. **제목**: 호기심을 유발하는 질문형 또는 반전 제목
2. **hook**: 첫 문장으로 독자의 주목을 끄는 도입부 (50자 내외)
3. **angle**: 이 글만의 차별화 포인트/관점
4. **sourceInsightIds**: 참조한 인사이트 번호 배열
5. **sourceBlockIds**: 참조한 블록 ID 배열
6. **platformContents**: 각 플랫폼별 최적화된 콘텐츠

### 플랫폼별 요구사항
${targetPlatforms.map(p => `- **${p}**: ${platformConfig[p].style} (${platformConfig[p].maxLength}자 이내, 해시태그 ${platformConfig[p].hashtagCount}개)`).join('\n')}

### 중요 원칙
- 인사이트의 "실제 대화 원문"을 자연스럽게 녹여낼 것
- 추상적인 개념은 반드시 구체적인 예시/숫자로 풀어쓸 것
- 각 글감은 서로 다른 앵글로 차별화될 것
- 독자가 "아, 그래서?" 하고 계속 읽고 싶게 만들 것

## JSON 형식
{
  "articles": [
    {
      "title": "제목",
      "hook": "도입부 한 문장",
      "angle": "차별화 앵글",
      "sourceInsightIds": ["0", "2"],
      "sourceBlockIds": ["intro-1", "benefits-1"],
      "platformContents": [
        {
          "platform": "x",
          "content": "X용 280자 이내 콘텐츠",
          "hashtags": ["해시태그1", "해시태그2"]
        },
        {
          "platform": "linkedin",
          "content": "LinkedIn용 콘텐츠\\n\\n줄바꿈 활용",
          "hashtags": ["해시태그1", "해시태그2", "해시태그3"]
        }
      ]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"articles":[]}');

    // Add metadata and IDs
    const articles: GeneratedArticle[] = (result.articles || []).map(
      (article: Omit<GeneratedArticle, 'id' | 'targetAudience' | 'createdAt'>, index: number) => ({
        ...article,
        id: `article-${Date.now()}-${index}`,
        targetAudience,
        createdAt: new Date().toISOString(),
        platformContents: (article.platformContents || []).map((pc: { platform: ContentFactoryPlatform; content: string; hashtags: string[] }) => ({
          ...pc,
          characterCount: pc.content?.length || 0,
        })),
      })
    );

    const response: BulkArticleResponse = {
      articles,
      meta: {
        insightsUsed: insights.length,
        blocksUsed: blocks.length,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate bulk articles error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate articles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
