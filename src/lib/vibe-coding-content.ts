import { ContentBlock, VibeCodingTheme } from '@/types';

/**
 * Vibe Coding content blocks parsed from the report
 * Source: 바이브코딩 살아남기.md
 */
export const vibeCodingBlocks: ContentBlock[] = [
  // ===== INTRO: 바이브코딩 정의, 패러다임 변화 =====
  {
    id: 'intro-1',
    theme: 'intro',
    title: '바이브 코딩이란?',
    keyPoints: [
      '안드레이 카파시가 주창한 새로운 개발 패러다임',
      '코드의 내부 로직보다 "느낌(Vibe)"에 의존하는 개발',
      '"코드가 존재한다는 사실조차 잊어버리는 것"이 목표',
      '자연어로 의도를 설명하면 AI가 코드를 생성',
    ],
    examples: [
      '과거 개발이 "건축"이었다면, 바이브코딩은 "재즈 연주"',
      '"Accept All" 버튼을 누르는 관리자로 역할 변화',
      '영어(모국어)가 가장 강력한 프로그래밍 언어가 됨',
    ],
    targetKeywords: ['바이브코딩', 'vibe coding', 'AI 코딩', '자연어', '카파시', 'cursor', 'copilot'],
  },
  {
    id: 'intro-2',
    theme: 'intro',
    title: '지식의 민주화',
    keyPoints: [
      '전문 지식의 비대칭성 해체',
      '코딩 지식 없는 비전공자도 앱 개발 가능',
      '인문학적 상상력이 소프트웨어 시장으로 유입',
      '"허가받지 않은 혁신"의 시대',
    ],
    examples: [
      '기획자도 자신의 추상적 상상을 앱으로 구현',
      '엑셀 수식 몰라도 경비 처리 앱 만들 수 있음',
      '노트북 한 대와 AI 구독만으로 비즈니스 시작',
    ],
    targetKeywords: ['비전공자', '기획자', '민주화', '앱 개발', 'no-code', '코딩 없이'],
  },

  // ===== BENEFITS: 속도 혁명, 인지 확장, 리스크 분산 =====
  {
    id: 'benefits-1',
    theme: 'benefits',
    title: '아이디어→배포 제로 레이턴시',
    keyPoints: [
      '기획-디자인-개발-배포가 한 프롬프트 창에서 동시 발생',
      'MVP 개발 기간: 3개월 → 3일~2주',
      '아이디어가 떠오르면 즉시 시각적 결과 확인',
      '초단기 피드백 루프로 플로우 상태 유지',
    ],
    examples: [
      '"내가 원하는 앱"을 설명하면 수분 내 초안 생성',
      '개발 과정이 노동이 아닌 "창작의 유희"로 변화',
      '며칠 걸리던 작업을 몇 시간 만에 완료',
    ],
    targetKeywords: ['MVP', '속도', '빠른 개발', '프로토타입', '피드백', '플로우'],
  },
  {
    id: 'benefits-2',
    theme: 'benefits',
    title: 'AI는 동료이자 멘토',
    keyPoints: [
      '1인 개발자에게 AI는 동료이자 멘토 역할',
      '기술이 인간을 소외시키는 게 아니라 "번역기"로 기능',
      '투자금이나 개발팀 없이 즉시 시작 가능',
      '인간의 의지를 기술적으로 번역',
    ],
    examples: [
      '복잡한 쿼리 몰라도 대화로 앱 개발',
      '"슈퍼파워"를 부여받은 느낌',
      '기술적 배경 없어도 창업 가능',
    ],
    targetKeywords: ['1인 개발', '솔로 개발', 'AI 도구', '창업', '부업', '사이드 프로젝트'],
  },
  {
    id: 'benefits-3',
    theme: 'benefits',
    title: '실패 비용 제로',
    keyPoints: [
      'MVP 개발 비용이 사실상 0에 수렴',
      '가설이 틀리면 즉시 폐기하고 다음 아이디어로',
      '다양한 가설을 동시다발적으로 검증 가능',
      '하나의 아이디어에 매몰되지 않는 포트폴리오 접근',
    ],
    examples: [
      '기존: MVP 개발에 수천만 원/수개월 필요',
      '지금: 실패해도 매몰 비용이 낮아 재도전 용이',
      '여러 개의 작은 실험을 동시에 진행',
    ],
    targetKeywords: ['실패', 'MVP', '린 스타트업', '피보팅', '비용', '리스크'],
  },

  // ===== RISKS: 기술 부채, 인지 퇴화, 책임 병목 =====
  {
    id: 'risks-1',
    theme: 'risks',
    title: '블랙박스 코드의 위험',
    keyPoints: [
      '"Accept All" 습관으로 코드가 통제 불능 블랙박스가 됨',
      'AI 생성 코드를 이해/테스트 안 하면 "무책임한 도박"',
      '버그 발생 시 원인 파악 불가, AI도 해결 못하면 좌초',
      '보안 취약점이 누락된 채 배포될 위험',
    ],
    examples: [
      '카파시도 "주말용 토이 프로젝트"에만 적합하다고 인정',
      '스파게티 코드와 보안 취약점 문제',
      '비즈니스 성장 후 치명적 리스크로 작용',
    ],
    targetKeywords: ['보안', '기술 부채', '버그', '유지보수', '블랙박스', '코드 품질'],
  },
  {
    id: 'risks-2',
    theme: 'risks',
    title: '인지적 퇴화 경고',
    keyPoints: [
      '뇌는 인지적 노력을 최소화하려는 경향 (인지적 구두쇠)',
      '"생산적 어려움" 없이는 진짜 학습이 일어나지 않음',
      'AI 의존도 높을수록 비판적 사고 멈춤',
      '장기적으로 "AI 없이는 아무것도 못하는" 무력감',
    ],
    examples: [
      '고민하고 실패하는 과정에서 뇌 시냅스가 강화됨',
      '"이 코드가 정말 최선인가?" 질문을 멈추게 됨',
      '단순한 "오퍼레이터"로 전락할 위험',
    ],
    targetKeywords: ['스킬', '역량', '퇴화', '학습', '비판적 사고', '의존', '멍청해지다'],
  },
  {
    id: 'risks-3',
    theme: 'risks',
    title: '1인 유니콘의 환상',
    keyPoints: [
      '500개 AI 에이전트 써도 책임은 1인에게 귀속',
      '고객 불만, 서비스 장애, 규제 준수는 자동화 불가',
      '1인 기업의 한계는 "생산성"이 아닌 "책임"에 있음',
      '정신적 대역폭의 한계로 번아웃 위험',
    ],
    examples: [
      '"1인 10억 달러 기업" 예언의 현실적 한계',
      '금융/의료 등 신뢰 필요 산업 진입 어려움',
      '"1년 뒤에도 존재할까?" 의구심 해소 어려움',
    ],
    targetKeywords: ['1인 기업', '솔로 유니콘', '번아웃', '한계', '책임', '규제'],
  },

  // ===== STRATEGY: 딥워크, 컨텍스트 엔지니어링, 시스템 사고 =====
  {
    id: 'strategy-1',
    theme: 'strategy',
    title: '딥워크로 뇌 지키기',
    keyPoints: [
      '얕은 작업은 AI에게, 깊은 작업은 직접',
      '방해받지 않는 "딥워크" 시간 확보 필수',
      '주기적 AI 디톡스로 논리 회로 유지',
      '"의도적인 불편함"만이 뇌 퇴화를 막음',
    ],
    examples: [
      '이메일/일정 관리는 AI에게 위임',
      '장기 전략 수립, 협상 시나리오는 직접',
      'AI 끄고 화이트보드만으로 아키텍처 설계',
    ],
    targetKeywords: ['딥워크', '집중', '몰입', '전략', '사고력', '학습'],
  },
  {
    id: 'strategy-2',
    theme: 'strategy',
    title: '컨텍스트 엔지니어링',
    keyPoints: [
      'AI가 모르는 "우리만의 문맥"이 진짜 해자',
      '회사의 고유 데이터, 암묵적 지식을 AI에 주입',
      '범용 AI를 "전용 지능"으로 변환',
      '고객과의 미묘한 뉘앙스는 데이터화 어려움',
    ],
    examples: [
      '프롬프트 엔지니어링을 넘어선 차원',
      '실패 경험에서 얻은 암묵지가 차별화 원천',
      '비정형 정보를 해석하는 "통역사" 역할',
    ],
    targetKeywords: ['컨텍스트', '문맥', '차별화', '해자', 'moat', '암묵지'],
  },
  {
    id: 'strategy-3',
    theme: 'strategy',
    title: '시스템적 사고',
    keyPoints: [
      'AI는 과제 수행에 탁월하지만 "왜 필요한가"는 모름',
      '개별 코더가 아닌 "시스템 설계자"가 되어야',
      'AI가 제시한 답의 편향/오류 찾는 비판적 시각',
      'AI 시대에 답은 싸고 질문은 비쌈',
    ],
    examples: [
      'AI 모듈들이 전체 목표를 향해 정렬되도록 조율',
      '"날카로운 질문" 던지는 능력이 핵심',
      '메타인지로 상위 레벨에서 판단',
    ],
    targetKeywords: ['시스템', '아키텍처', '질문', '메타인지', '전체 그림'],
  },

  // ===== EXECUTION: 퍼스널 홀딩 컴퍼니, 바이탈리티 경영 =====
  {
    id: 'execution-1',
    theme: 'execution',
    title: '퍼스널 홀딩 컴퍼니 모델',
    keyPoints: [
      '하나의 제품에 운명 걸지 않기',
      '여러 소규모 비즈니스를 포트폴리오로 운영',
      'Micro-SaaS, 뉴스레터, 커뮤니티, 디지털 에셋',
      '창업가 퍼스널 브랜드가 구심점',
    ],
    examples: [
      '여러 "작은 성공(Small Bets)" 동시 운영',
      '한 프로젝트 실패해도 전체 생존 위협 없음',
      '교차 판매 가능한 생태계 형성',
    ],
    targetKeywords: ['포트폴리오', 'micro-saas', '사이드 프로젝트', '수익 다각화', '부업'],
  },
  {
    id: 'execution-2',
    theme: 'execution',
    title: '아티장 소프트웨어',
    keyPoints: [
      '모든 게 AI로 양산되면, 인간 손길은 "럭셔리"가 됨',
      '좁고 깊은 니치마켓을 섬세한 UX로 공략',
      '기능 나열 아닌 감정적 만족과 경험의 질',
      '"슬로우 테크" 철학으로 차별화',
    ],
    examples: [
      '대규모 SaaS가 못 커버하는 틈새 공략',
      '기술 성능 넘어선 가치 소비 지향',
      '팬덤을 만드는 브랜딩 전략',
    ],
    targetKeywords: ['부티크', '니치', 'UX', '브랜드', '프리미엄', '장인정신'],
  },
  {
    id: 'execution-3',
    theme: 'execution',
    title: '바이탈리티 경영',
    keyPoints: [
      '번아웃은 1인 기업의 최대 리스크',
      '수면/영양/운동을 "가장 중요한 업무"로 인식',
      '맑은 정신에서만 AI를 넘어서는 통찰 가능',
      '자기 성찰 루틴으로 나침반 역할',
    ],
    examples: [
      'AI는 지치지 않지만, 인간 창의성은 생명력에서 나옴',
      '매일/매주 감정과 방향성 회고',
      '가치관에 부합하는지 점검하는 습관',
    ],
    targetKeywords: ['번아웃', '에너지', '건강', '자기관리', '루틴', '성찰'],
  },

  // ===== CONCLUSION: 켄타우로스 모델 =====
  {
    id: 'conclusion-1',
    theme: 'conclusion',
    title: '켄타우로스 모델',
    keyPoints: [
      'AI의 속도(말의 하반신) + 인간의 지성(인간의 상반신)',
      '바이브코딩을 즐기되, 작동 원리도 이해하라',
      '"기능"이 아닌 "통찰, 공감, 철학"에 집중',
      '고유 문맥과 가치관이 대체 불가능한 해자',
    ],
    examples: [
      'Enjoy the Vibe, but understand the Mechanics',
      '문제를 정의하는 능력, 사람을 이해하는 공감',
      '질문을 던지고 책임질 수 있는 뇌',
    ],
    targetKeywords: ['켄타우로스', '인간+AI', '하이브리드', '미래', '가치관'],
  },
  {
    id: 'conclusion-2',
    theme: 'conclusion',
    title: '파운더 주도 성장',
    keyPoints: [
      '기술 평준화 시대, "누구에게서 샀냐"가 중요',
      '창업가의 고유한 경험/취향/세계관이 독점 영역',
      '창업 여정을 투명하게 공개(Building in Public)',
      '커뮤니티 먼저, 제품은 그 다음',
    ],
    examples: [
      'AI가 긁어갈 수 없는 "나만의 서사"',
      '실패와 성공 공유로 형성되는 신뢰 자본',
      '마케팅 예산으로 살 수 없는 팬덤',
    ],
    targetKeywords: ['퍼스널 브랜드', 'building in public', '커뮤니티', '신뢰', '팬덤'],
  },
];

/**
 * Get blocks by theme
 */
export function getBlocksByTheme(theme: VibeCodingTheme): ContentBlock[] {
  return vibeCodingBlocks.filter(block => block.theme === theme);
}

/**
 * Get block by ID
 */
export function getBlockById(id: string): ContentBlock | undefined {
  return vibeCodingBlocks.find(block => block.id === id);
}

/**
 * Get all themes with display names
 */
export const themeDisplayNames: Record<VibeCodingTheme, string> = {
  intro: '바이브코딩 소개',
  benefits: '장점과 효용',
  risks: '위험 요소',
  strategy: '대응 전략',
  execution: '실행 방안',
  conclusion: '결론',
};

/**
 * Match insights to relevant blocks based on keywords
 */
export function matchInsightsToBlocks(
  insights: Array<{ tags: string[]; content: string }>,
  blocks: ContentBlock[]
): Map<string, string[]> {
  const matches = new Map<string, string[]>();

  for (const block of blocks) {
    const matchedInsightIndices: string[] = [];

    insights.forEach((insight, index) => {
      const insightText = `${insight.content} ${insight.tags.join(' ')}`.toLowerCase();

      // Check if any target keyword matches
      const hasMatch = block.targetKeywords.some(keyword =>
        insightText.includes(keyword.toLowerCase())
      );

      if (hasMatch) {
        matchedInsightIndices.push(String(index));
      }
    });

    if (matchedInsightIndices.length > 0) {
      matches.set(block.id, matchedInsightIndices);
    }
  }

  return matches;
}

/**
 * Non-developer friendly term translations
 */
export const termTranslations: Record<string, string> = {
  API: '앱들이 서로 대화하는 방법',
  컨텍스트: 'AI가 기억하고 있는 대화 내용',
  프롬프트: 'AI에게 하는 요청/질문',
  MVP: '최소한의 기능만 가진 첫 버전',
  SaaS: '인터넷으로 쓰는 구독형 서비스',
  피보팅: '방향을 바꾸는 것',
  스타트업: '성장을 추구하는 신생 기업',
  레거시: '오래되어 바꾸기 어려운 시스템',
  리팩토링: '코드를 깔끔하게 정리하는 작업',
  배포: '만든 것을 세상에 공개하는 것',
  디버깅: '문제를 찾아서 고치는 것',
  아키텍처: '전체적인 설계/구조',
};
