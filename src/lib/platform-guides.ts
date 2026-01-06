import { Platform, PlatformGuide, SetupItem } from '@/types';

export const platformGuides: Record<Platform, PlatformGuide> = {
  x: {
    platform: 'x',
    name: 'X (Twitter)',
    icon: 'X',
    color: '#000000',
    description: '해외 1인 개발자 커뮤니티의 중심. 빌드인퍼블릭 문화가 활발합니다.',
    defaultDailyGoals: [
      { type: 'follow', count: 5, description: '관심 분야 개발자 팔로우' },
      { type: 'comment', count: 1, description: '의미있는 댓글 남기기' },
    ],
    defaultWeeklyGoals: [
      { type: 'post', count: 3, description: '개발 진행상황 공유' },
    ],
    defaultMonthlyGoals: [
      { type: 'post', count: 1, description: '성과/회고 스레드 작성' },
    ],
    tips: [
      '매일 같은 시간대에 활동하면 알고리즘에 유리합니다',
      '해시태그는 2-3개만 사용하세요',
      '빌드인퍼블릭 해시태그를 활용하세요 (#buildinpublic)',
      '질문형 트윗이 더 많은 반응을 얻습니다',
      '스레드 형식으로 긴 내용을 공유하세요',
    ],
    commentTemplates: [
      'This is really helpful! I especially liked the part about {specific}.',
      'Great insight! Have you considered {suggestion}?',
      'Love this approach. I\'ve been doing something similar with {your_experience}.',
      'Thanks for sharing! Quick question - {question}?',
      'Congrats on the progress! What was the biggest challenge?',
    ],
    hashtagSuggestions: [
      '#buildinpublic',
      '#indiehackers',
      '#solopreneur',
      '#startups',
      '#coding',
      '#webdev',
      '#saas',
      '#entrepreneur',
    ],
    growthStrategy: [
      '팔로우할 타겟 리스트 만들기 (경쟁사 팔로워, 인플루언서 등)',
      '매일 5명 이상 진정성 있는 팔로우',
      '인기 계정의 트윗에 빠르게 양질의 댓글 달기',
      '주 3회 이상 개발 진행상황 공유',
      '월 1회 성과/교훈 스레드 작성',
    ],
    setupGuide: [
      { id: 'profile-photo', title: '프로필 사진 설정', description: '전문적이고 기억에 남는 프로필 사진 업로드' },
      { id: 'bio', title: '바이오 작성', description: '누군지, 어떤 가치를 제공하는지 명확하게' },
      { id: 'header', title: '헤더 이미지 설정', description: '프로젝트나 브랜드를 보여주는 배너' },
      { id: 'website', title: '웹사이트 링크 추가', description: '포트폴리오, 제품, 또는 링크트리' },
      { id: 'pinned', title: '고정 트윗 설정', description: '자기소개 또는 대표 콘텐츠 고정' },
    ],
  },

  producthunt: {
    platform: 'producthunt',
    name: 'Product Hunt',
    icon: 'ProductHunt',
    color: '#DA552F',
    description: '제품 런칭의 성지. 꾸준한 활동으로 런칭 전 팔로워를 확보하세요.',
    defaultDailyGoals: [
      { type: 'like', count: 1, description: '관심 제품 업보트' },
      { type: 'comment', count: 1, description: '제품에 피드백 남기기' },
    ],
    defaultWeeklyGoals: [
      { type: 'comment', count: 5, description: '다양한 제품에 댓글' },
    ],
    defaultMonthlyGoals: [
      { type: 'post', count: 1, description: '제품/업데이트 런칭' },
    ],
    tips: [
      '런칭 전 최소 2주간 활발히 활동하세요',
      '다른 메이커들의 제품에 진심어린 피드백을 남기세요',
      '헌터와 관계를 맺어두면 런칭에 도움됩니다',
      'PST 기준 자정에 런칭하면 24시간 노출됩니다',
      '런칭일에는 모든 댓글에 1시간 내 답변하세요',
    ],
    commentTemplates: [
      'Love the concept! How does this compare to {competitor}?',
      'The UI looks clean. What stack did you use?',
      'Interesting approach to {problem}. Have you thought about {suggestion}?',
      'Congrats on the launch! What was your development timeline?',
      'This solves a real pain point. What\'s on your roadmap?',
    ],
    growthStrategy: [
      '매일 1개 이상 제품에 업보트 + 댓글',
      '메이커들과 관계 구축 (Twitter 연동)',
      '런칭 2주 전부터 활동량 증가',
      '헌터 섭외 및 관계 구축',
      '런칭 후 모든 피드백에 빠르게 응답',
    ],
    setupGuide: [
      { id: 'profile', title: '메이커 프로필 완성', description: '사진, 바이오, SNS 링크 연동' },
      { id: 'twitter', title: 'Twitter 연동', description: '트위터 연결로 신뢰도 상승' },
      { id: 'first-upvotes', title: '첫 업보트 활동', description: '관심있는 제품 10개에 업보트' },
      { id: 'first-comments', title: '첫 댓글 활동', description: '3개 제품에 의미있는 피드백' },
    ],
  },

  medium: {
    platform: 'medium',
    name: 'Medium',
    icon: 'Medium',
    color: '#000000',
    description: '기술 블로그의 대표 플랫폼. 긴 형식의 콘텐츠로 전문성을 보여주세요.',
    defaultDailyGoals: [],
    defaultWeeklyGoals: [
      { type: 'post', count: 1, description: '기술 아티클 발행' },
    ],
    defaultMonthlyGoals: [
      { type: 'post', count: 4, description: '월간 포스팅 목표' },
    ],
    tips: [
      '제목에 숫자와 구체적인 키워드를 넣으세요',
      '첫 문단에서 독자의 관심을 끌어야 합니다',
      '관련 Publication에 기고하면 노출이 늘어납니다',
      '코드 블록과 이미지를 적절히 활용하세요',
      '시리즈로 연재하면 독자 리텐션이 높아집니다',
    ],
    commentTemplates: [
      'Great article! The section about {topic} was particularly insightful.',
      'Thanks for the detailed explanation. One question - {question}?',
      'I\'ve been looking for this exact information. Have you tried {alternative}?',
      'Well written! Would love to see a follow-up on {related_topic}.',
      'This helped me solve {problem}. Thanks for sharing!',
    ],
    growthStrategy: [
      '주 1회 이상 양질의 기술 아티클 발행',
      'Better Programming, Towards Data Science 등 Publication 기고',
      'Twitter/LinkedIn에 아티클 공유',
      '다른 작가들의 글에 양질의 댓글',
      '시리즈 형식으로 깊이 있는 콘텐츠 제작',
    ],
    setupGuide: [
      { id: 'profile', title: '프로필 사진 설정', description: '전문적인 프로필 사진' },
      { id: 'bio', title: '바이오 작성', description: '어떤 주제로 글을 쓰는지' },
      { id: 'publications', title: 'Publication 팔로우', description: '관심 분야 Publication 5개 이상' },
      { id: 'connect', title: 'Twitter/LinkedIn 연동', description: '소셜 계정 연결' },
    ],
  },

  naver: {
    platform: 'naver',
    name: '네이버 블로그',
    icon: 'Naver',
    color: '#03C75A',
    description: '국내 SEO의 핵심. 개발 일기로 꾸준한 검색 노출을 확보하세요.',
    defaultDailyGoals: [],
    defaultWeeklyGoals: [],
    defaultMonthlyGoals: [
      { type: 'post', count: 2, description: '진행상황 일기 작성' },
    ],
    tips: [
      '제목에 검색 키워드를 자연스럽게 포함하세요',
      '이미지를 3장 이상 포함하면 SEO에 유리합니다',
      '글자 수는 최소 1500자 이상 작성하세요',
      '관련 태그를 5-10개 추가하세요',
      '이웃 블로거들과 소통하면 노출이 늘어납니다',
    ],
    commentTemplates: [
      '좋은 글 잘 읽었습니다! {topic} 부분이 특히 도움이 됐어요.',
      '저도 비슷한 경험이 있는데요, {your_experience}.',
      '궁금한 점이 있는데요, {question}?',
      '정리가 깔끔하네요. 혹시 {related_topic}에 대한 글도 계획 있으신가요?',
      '이 글 덕분에 {benefit} 할 수 있었습니다. 감사합니다!',
    ],
    growthStrategy: [
      '월 2회 이상 개발 진행상황 일기 작성',
      '검색 키워드 리서치 후 제목 최적화',
      '이미지와 스크린샷 풍부하게 활용',
      '이웃 블로거들과 소통 (이웃추가, 댓글)',
      '시리즈 연재로 재방문 유도',
    ],
    setupGuide: [
      { id: 'nickname', title: '블로그명 설정', description: '기억하기 쉬운 블로그 이름' },
      { id: 'profile', title: '프로필 설정', description: '프로필 사진과 소개글' },
      { id: 'category', title: '카테고리 정리', description: '글 주제별 카테고리 생성' },
      { id: 'neighbors', title: '이웃 추가', description: '같은 관심사 블로거 10명' },
    ],
  },

  youtube: {
    platform: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    color: '#FF0000',
    description: '영상 콘텐츠의 왕. 숏폼으로 빠른 성장, 정규 영상으로 깊이를 더하세요.',
    defaultDailyGoals: [
      { type: 'post', count: 1, description: '숏폼 영상 업로드' },
    ],
    defaultWeeklyGoals: [],
    defaultMonthlyGoals: [
      { type: 'post', count: 1, description: '정규 영상 업로드' },
    ],
    tips: [
      '썸네일이 클릭률의 90%를 결정합니다',
      '처음 30초 안에 핵심을 전달하세요',
      '일관된 업로드 주기를 유지하세요',
      '댓글에 빠르게 답변하면 알고리즘에 유리합니다',
      '숏폼은 구독자 확보, 정규 영상은 시청시간 확보에 유리합니다',
    ],
    commentTemplates: [
      '영상 잘 봤습니다! {timestamp}에서 말씀하신 부분이 인상적이었어요.',
      '좋은 정보 감사합니다. 혹시 {related_topic}에 대한 영상도 계획 있으신가요?',
      '덕분에 {benefit} 할 수 있었습니다!',
      '{timestamp} 부분에 대해 질문이 있는데요, {question}?',
      '이 채널 발견한 게 행운이네요. 구독하고 갑니다!',
    ],
    hashtagSuggestions: [
      '#코딩',
      '#개발자',
      '#프로그래밍',
      '#1인개발',
      '#사이드프로젝트',
      '#스타트업',
      '#빌드인퍼블릭',
    ],
    growthStrategy: [
      '매일 1개 숏폼 (개발 팁, 진행상황 등)',
      '월 1회 이상 정규 영상 (튜토리얼, 회고 등)',
      '눈에 띄는 썸네일 제작',
      '모든 댓글에 답변',
      '커뮤니티 탭 활용',
    ],
    setupGuide: [
      { id: 'channel-art', title: '채널 아트 설정', description: '배너 이미지와 프로필 사진' },
      { id: 'description', title: '채널 설명 작성', description: '채널 소개와 업로드 주기' },
      { id: 'links', title: '링크 추가', description: '소셜 미디어 링크 연결' },
      { id: 'playlist', title: '재생목록 생성', description: '콘텐츠 분류용 재생목록' },
    ],
  },

  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E4405F',
    description: '비주얼 스토리텔링. 개발 과정을 시각적으로 공유하세요.',
    defaultDailyGoals: [
      { type: 'post', count: 1, description: '릴스 업로드' },
    ],
    defaultWeeklyGoals: [],
    defaultMonthlyGoals: [
      { type: 'post', count: 1, description: '피드 포스트 업로드' },
    ],
    tips: [
      '릴스가 도달률이 가장 높습니다',
      '일관된 비주얼 테마를 유지하세요',
      '스토리로 일상적인 개발 과정을 공유하세요',
      '해시태그는 5-10개가 적당합니다',
      '다른 계정과 적극적으로 소통하세요',
    ],
    commentTemplates: [
      '멋진 작업이네요! 어떤 도구로 만드셨나요?',
      '디자인이 깔끔해요. {specific_part}이 특히 좋네요.',
      '저도 비슷한 걸 만들고 있는데, {question}?',
      '영감을 받았습니다. 개발 과정이 궁금해요!',
      '대박! 이거 만드는 데 얼마나 걸리셨어요?',
    ],
    hashtagSuggestions: [
      '#개발자일상',
      '#코딩',
      '#개발스타그램',
      '#프로그래머',
      '#사이드프로젝트',
      '#1인개발',
      '#스타트업',
      '#앱개발',
    ],
    growthStrategy: [
      '매일 릴스 업로드 (개발 과정, 팁 등)',
      '월 1회 이상 피드 포스트 (성과, 결과물 등)',
      '스토리로 일상 공유',
      '관련 계정 팔로우 및 소통',
      '일관된 비주얼 아이덴티티 유지',
    ],
    setupGuide: [
      { id: 'business', title: '비즈니스 계정 전환', description: '인사이트 확인을 위해' },
      { id: 'bio', title: '바이오 작성', description: '계정 소개 (이모지 활용)' },
      { id: 'link', title: '링크 추가', description: '링크트리 또는 웹사이트' },
      { id: 'highlight', title: '하이라이트 설정', description: '스토리 하이라이트 카테고리' },
    ],
  },

  reddit: {
    platform: 'reddit',
    name: 'Reddit',
    icon: 'Reddit',
    color: '#FF4500',
    description: '가장 솔직한 피드백을 받을 수 있는 곳. 카르마를 쌓고 신뢰를 얻으세요.',
    defaultDailyGoals: [
      { type: 'karma', count: 1, description: '카르마 획득 활동' },
    ],
    defaultWeeklyGoals: [
      { type: 'comment', count: 5, description: '유용한 댓글 작성' },
    ],
    defaultMonthlyGoals: [
      { type: 'post', count: 2, description: '프로젝트 공유 포스트' },
    ],
    tips: [
      '먼저 카르마를 쌓은 후 홍보하세요',
      '서브레딧 규칙을 반드시 확인하세요',
      '너무 홍보성 글은 다운보트 당합니다',
      '질문에 성실히 답변하면 신뢰를 얻습니다',
      'Show HN 스타일로 솔직하게 공유하세요',
    ],
    commentTemplates: [
      'Great question! In my experience, {answer}.',
      'I\'ve dealt with this before. What worked for me was {solution}.',
      'Have you considered {alternative}? It might solve your issue.',
      'This is a common misconception. Actually, {correct_info}.',
      'Adding to this - {additional_info}.',
    ],
    growthStrategy: [
      '매일 관련 서브레딧에서 유용한 댓글 작성',
      '질문 글에 상세한 답변 제공',
      '카르마 500 이상 확보 후 프로젝트 공유',
      'r/SideProject, r/indiehackers 등 관련 서브레딧 활용',
      '솔직하고 겸손한 톤 유지',
    ],
    setupGuide: [
      { id: 'avatar', title: '아바타 설정', description: '프로필 아바타 커스터마이징' },
      { id: 'bio', title: '바이오 작성', description: '간단한 자기소개' },
      { id: 'subreddits', title: '서브레딧 가입', description: '관심 분야 커뮤니티 10개' },
      { id: 'karma', title: '카르마 쌓기', description: '유용한 댓글로 기본 카르마' },
    ],
  },

  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    icon: 'Linkedin',
    color: '#0A66C2',
    description: '전문가 네트워크. B2B나 채용에 관심 있다면 필수입니다.',
    defaultDailyGoals: [],
    defaultWeeklyGoals: [
      { type: 'post', count: 1, description: '전문 포스트 작성' },
    ],
    defaultMonthlyGoals: [
      { type: 'comment', count: 10, description: '네트워크 활동' },
    ],
    tips: [
      '첫 줄에서 관심을 끌어야 합니다 (hook)',
      '개인적인 스토리가 더 많은 반응을 얻습니다',
      '이모지와 줄바꿈으로 가독성을 높이세요',
      '댓글에 빠르게 답변하면 알고리즘에 유리합니다',
      '다른 포스트에 양질의 댓글을 남기세요',
    ],
    commentTemplates: [
      'Great insights! The point about {topic} resonates with my experience.',
      'Thanks for sharing this. Have you considered {suggestion}?',
      'This is so true. In my journey, I found that {your_experience}.',
      'Valuable perspective! Quick question - {question}?',
      'Congrats on this milestone! What was the biggest lesson learned?',
    ],
    growthStrategy: [
      '주 1회 이상 개발/창업 경험 포스트',
      '업계 리더들의 포스트에 양질의 댓글',
      '개인적인 스토리텔링 활용',
      '프로젝트 성과와 교훈 공유',
      '관련 분야 전문가들과 연결',
    ],
    setupGuide: [
      { id: 'photo', title: '프로필 사진', description: '전문적인 헤드샷' },
      { id: 'headline', title: '헤드라인 작성', description: '직함 + 전문 분야' },
      { id: 'about', title: 'About 섹션', description: '경력 요약과 비전' },
      { id: 'experience', title: '경력 추가', description: '주요 경력 사항' },
      { id: 'skills', title: '스킬 추가', description: '핵심 기술 최소 5개' },
    ],
  },

  indiehackers: {
    platform: 'indiehackers',
    name: 'Indie Hackers',
    icon: 'IndieHackers',
    color: '#0E2439',
    description: '인디 해커들의 커뮤니티. 수익화 여정을 공유하고 피드백을 받으세요.',
    defaultDailyGoals: [],
    defaultWeeklyGoals: [
      { type: 'comment', count: 3, description: '토론 참여' },
    ],
    defaultMonthlyGoals: [
      { type: 'post', count: 2, description: '프로젝트 업데이트' },
    ],
    tips: [
      '수익 숫자를 공개하면 더 많은 관심을 받습니다',
      '실패 경험도 가치 있는 콘텐츠입니다',
      '구체적인 전략과 숫자를 공유하세요',
      '다른 인디해커들의 질문에 답변하세요',
      '밀스톤 달성시 공유하면 좋은 반응을 얻습니다',
    ],
    commentTemplates: [
      'Congrats on the milestone! What was your main acquisition channel?',
      'Great progress! How are you handling {challenge}?',
      'This is inspiring. What would you do differently if starting over?',
      'Thanks for the transparency. Quick question about {specific_topic}?',
      'Love the approach. Have you considered {suggestion}?',
    ],
    growthStrategy: [
      '주 1회 이상 토론에 참여',
      '월 1-2회 진행상황 업데이트',
      '수익/사용자 숫자 투명하게 공개',
      '다른 프로젝트에 피드백 제공',
      '실패와 성공 모두 솔직하게 공유',
    ],
    setupGuide: [
      { id: 'profile', title: '프로필 완성', description: '사진과 바이오' },
      { id: 'product', title: '프로젝트 등록', description: '만들고 있는 제품/서비스' },
      { id: 'groups', title: '그룹 가입', description: '관심 분야 그룹 참여' },
      { id: 'intro', title: '자기소개 포스트', description: '첫 글로 자기소개' },
    ],
  },

  kakao: {
    platform: 'kakao',
    name: '카카오 오픈챗',
    icon: 'Kakao',
    color: '#FEE500',
    description: '국내 개발자 커뮤니티. 실시간 소통과 정보 공유가 활발합니다.',
    defaultDailyGoals: [
      { type: 'comment', count: 1, description: '대화 참여' },
    ],
    defaultWeeklyGoals: [
      { type: 'share', count: 1, description: '유용한 정보 공유' },
    ],
    defaultMonthlyGoals: [],
    tips: [
      '자기 소개를 먼저 하고 활동을 시작하세요',
      '질문하기 전에 검색으로 기존 답변을 확인하세요',
      '도움을 받으면 감사 인사를 잊지 마세요',
      '유용한 정보나 링크를 적극적으로 공유하세요',
      '오프라인 모임에 참석하면 관계가 깊어집니다',
    ],
    commentTemplates: [
      '좋은 정보 감사합니다! 저도 비슷한 경험이 있는데 {your_experience}.',
      '혹시 {topic}에 대해 아시는 분 계신가요?',
      '이 자료 공유드립니다: {link}. {description}.',
      '저도 관심있어요! 진행상황 공유해주시면 참고하겠습니다.',
      '도움이 필요하시면 DM 주세요. 제가 아는 선에서 도와드릴게요.',
    ],
    growthStrategy: [
      '관련 오픈채팅방 가입 및 자기소개',
      '매일 유익한 대화에 참여',
      '주 1회 이상 유용한 정보/링크 공유',
      '질문에 성실히 답변',
      '오프라인 모임 참석',
    ],
    setupGuide: [
      { id: 'profile', title: '오픈프로필 설정', description: '오픈채팅용 프로필 생성' },
      { id: 'rooms', title: '오픈채팅방 찾기', description: '관심 분야 채팅방 가입' },
      { id: 'intro', title: '자기소개 준비', description: '채팅방 입장 시 인사말' },
      { id: 'rules', title: '규칙 확인', description: '각 채팅방 규칙 숙지' },
    ],
  },
};

export function getPlatformList(): PlatformGuide[] {
  return Object.values(platformGuides);
}

export function getPlatformGuide(platform: Platform | string): PlatformGuide | undefined {
  return platformGuides[platform as Platform];
}

export const PLATFORM_GUIDES = platformGuides;
