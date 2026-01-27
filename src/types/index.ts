// 플랫폼 타입
export type Platform =
  | 'x'
  | 'threads'
  | 'producthunt'
  | 'medium'
  | 'naver'
  | 'youtube'
  | 'instagram'
  | 'reddit'
  | 'linkedin'
  | 'indiehackers'
  | 'kakao';

// 활동 타입
export type ActivityType =
  | 'follow'
  | 'comment'
  | 'like'
  | 'post'
  | 'karma'
  | 'share';

// 목표 주기
export type GoalFrequency = 'daily' | 'weekly' | 'monthly';

// 활동 목표
export interface ActivityGoal {
  type: ActivityType;
  count: number;
  description?: string;
}

// 플랫폼 설정
export interface PlatformSettings {
  id: string;
  user_id: string;
  platform: Platform;
  is_active: boolean;
  daily_goals: ActivityGoal[];
  weekly_goals: ActivityGoal[];
  monthly_goals: ActivityGoal[];
  profile_url?: string;
  custom_tips: string[];
}

// 활동 기록
export interface ActivityLog {
  id: string;
  user_id: string;
  platform: Platform;
  activity_type: ActivityType;
  target_url?: string;
  target_username?: string;
  notes?: string;
  completed_at: string;
}

// 추천 활동
export interface RecommendedAction {
  id: string;
  user_id: string;
  platform: Platform;
  action_type: ActivityType;
  target_url?: string;
  target_username?: string;
  target_content?: string;
  reason: string;
  sample_text?: string;
  is_completed: boolean;
  is_skipped: boolean;
  valid_date: string;
}

// 카톡방
export interface KakaoRoom {
  id: string;
  user_id: string;
  room_name: string;
  description?: string;
  created_at: string;
}

// 카톡 요약
export interface KakaoSummary {
  id: string;
  room_id: string;
  raw_content: string;
  date_range?: string;
  summary: string;
  hot_topics: Array<{ topic: string; links: string[] }>;
  announcements: string[];
  action_items: Array<{ type: string; description: string; target?: string }>;
  extracted_links: string[];
  created_at: string;
}

// 오늘의 진행 상황
export interface TodayProgress {
  platform: Platform;
  goals: ActivityGoal[];
  completed: number;
  total: number;
  logs: ActivityLog[];
}

// 초기 세팅 아이템
export interface SetupItem {
  id: string;
  title: string;
  description: string;
}

// 플랫폼 가이드 데이터
export interface PlatformGuide {
  platform: Platform;
  name: string;
  icon: string;
  color: string;
  description: string;
  defaultDailyGoals: ActivityGoal[];
  defaultWeeklyGoals: ActivityGoal[];
  defaultMonthlyGoals: ActivityGoal[];
  tips: string[];
  commentTemplates: string[];
  hashtagSuggestions?: string[];
  growthStrategy: string[];
  setupGuide?: SetupItem[];
}

// ===== 트렌드 수집 =====

// 트렌드 소스 타입
export type TrendSource = 'kakao' | 'community' | 'manual';

// 개별 트렌드 아이템
export interface TrendItem {
  id: string;
  source: TrendSource;
  platform?: Platform;
  content: string;
  keywords: string[];
  collectedAt: string;
  metadata?: Record<string, unknown>;
}

// 트렌드 컬렉션 (일별)
export interface TrendCollection {
  id: string;
  date: string;
  items: TrendItem[];
  summary?: string;
  analyzedAt?: string;
}

// ===== 뉴스/트렌드 크롤링 =====

// 뉴스 트렌드 플랫폼
export type NewsTrendPlatform = 'geeknews' | 'hackernews' | 'producthunt' | 'disquiet';

// 뉴스/트렌드 아이템
export interface NewsTrendItem {
  id: string;
  platform: NewsTrendPlatform;
  title: string;
  url: string;
  description?: string;
  score?: number;       // HN upvotes, PH upvotes
  comments?: number;
  author?: string;
  tags: string[];
  crawledAt: string;
}

// ===== 이벤트 모니터링 =====

// 이벤트 소스 플랫폼
export type EventSourcePlatform = 'onoffmix' | 'festa' | 'meetup' | 'okky' | 'custom';

// 이벤트 소스 (크롤링할 URL)
export interface EventSource {
  id: string;
  platform: EventSourcePlatform;
  url: string;
  name: string;
  keywords: string[];
  isActive: boolean;
  lastCrawledAt?: string;
  createdAt: string;
}

// 이벤트 유형
export type EventType = 'seminar' | 'conference' | 'meetup' | 'workshop' | 'study' | 'networking' | 'other';

// 개별 이벤트
export interface EventItem {
  id: string;
  sourceId: string;
  platform: EventSourcePlatform;
  title: string;
  description?: string;
  eventDate: string;
  eventEndDate?: string;
  location: string;
  isOnline: boolean;
  registrationUrl: string;
  imageUrl?: string;
  organizer?: string;
  cost?: string; // 무료, 10,000원 등
  capacity?: string; // 정원 70명 등
  tags: string[];
  eventType?: EventType; // 이벤트 유형
  status: 'upcoming' | 'ongoing' | 'ended';
  crawledAt: string;
}

// ===== 프로필 가이드 =====

// 사용자 프로필 정보 (AI 프로필 생성용)
export interface UserProfileInfo {
  name: string;
  role: string;              // 직업/역할
  expertise: string[];       // 전문분야
  targetAudience: string;    // 목표 청중
  goals: string;             // 달성하고 싶은 것
}

// 플랫폼별 프로필 추천
export interface PlatformProfileRecommendation {
  platform: Platform;
  bio: string;               // 생성된 바이오 문구
  bioAlternatives: string[]; // 대안 문구
  profilePhotoTips: string[];
  headerImageTips: string[];
  linkRecommendations: string[];
}

// ===== 크로스 포스팅 히스토리 =====

// 플랫폼별 변환된 컨텐츠
export interface PlatformContent {
  platform: Platform;
  content: string;
  hashtags: string[];
  postedAt?: string;         // 포스팅한 시간 (수동 표시)
}

// 포스팅 히스토리
export interface PostingHistory {
  id: string;
  topic: string;
  keyPoints: string;
  originalDraft: string;
  platformContents: PlatformContent[];
  createdAt: string;
}

// ===== 한영 동시 생성 =====

// 이중 언어 콘텐츠
export interface BilingualContent {
  ko: string;
  en: string;
}

// 이중 언어 변환 결과
export interface BilingualTransformResult {
  ko: {
    transformed_content: string;
    hashtags: string[];
    tips: string[];
    character_count: number;
  };
  en: {
    transformed_content: string;
    hashtags: string[];
    tips: string[];
    character_count: number;
  };
}

// ===== AI 글감 생성 =====

// 관련 인사이트 참조
export interface RelatedInsight {
  title: string;
  content: string;
  roomName: string;
}

// 트렌드 분석 결과 (Gemini Grounding)
export interface TrendAnalysis {
  currentTrends: string[];        // 최근 트렌드 키워드
  communityBuzz: string;          // 커뮤니티 반응 요약
  recentArticles: string[];       // 최근 관련 글/뉴스 제목
  suggestedHook: string;          // 추천 도입부
  searchedAt: string;             // 검색 시점
}

// 글감 제안
export interface TopicSuggestion {
  id: string;
  title: string;
  description: string;
  angle: string;                  // 차별화 포인트
  keyPoints: string[];
  relatedInsights: RelatedInsight[];
  trendAnalysis?: TrendAnalysis;
  platforms: Platform[];
  searchKeywords: string[];
}

// 글감 히스토리
export interface TopicHistory {
  id: string;
  topics: TopicSuggestion[];
  insightSummary: string;
  totalInsightsUsed: number;
  roomsUsed: string[];
  generatedAt: string;
  status: 'generated' | 'in_progress' | 'completed';
}

// ===== 크로스포스팅 템플릿 =====

// 작성 템플릿
export interface ComposeTemplate {
  id: string;
  name: string;
  topic: string;
  keyPoints: string;
  bilingual: boolean;
  createdAt: string;
  usedCount: number;
}

// ===== 콘텐츠 팩토리 =====

// 바이브코딩 문서 테마
export type VibeCodingTheme =
  | 'intro'      // 바이브코딩 정의, 패러다임 변화
  | 'benefits'   // 속도 혁명, 인지 확장, 리스크 분산
  | 'risks'      // 기술 부채, 인지 퇴화, 책임 병목
  | 'strategy'   // 딥워크, 컨텍스트 엔지니어링, 시스템 사고
  | 'execution'  // 퍼스널 홀딩 컴퍼니, 바이탈리티 경영
  | 'conclusion'; // 켄타우로스 모델

// 콘텐츠 블록
export interface ContentBlock {
  id: string;
  theme: VibeCodingTheme;
  title: string;
  keyPoints: string[];      // 핵심 포인트 3-5개
  examples: string[];       // 비유/예시
  targetKeywords: string[]; // 인사이트 매칭용 키워드
}

// 타겟 독자 유형
export type TargetAudience = 'general' | 'developer';

// 콘텐츠 팩토리 플랫폼 (지원하는 플랫폼만)
export type ContentFactoryPlatform = 'x' | 'linkedin' | 'naver' | 'medium';

// 생성된 글감
export interface GeneratedArticle {
  id: string;
  title: string;
  hook: string;                     // 도입부
  sourceInsightIds: string[];       // 사용된 인사이트 ID
  sourceBlockIds: string[];         // 사용된 문서 블록 ID
  angle: string;                    // 차별화 앵글
  platformContents: {
    platform: ContentFactoryPlatform;
    content: string;
    hashtags: string[];
    characterCount: number;
  }[];
  targetAudience: TargetAudience;
  createdAt: string;
}

// 글감 생성 요청
export interface BulkArticleRequest {
  insights: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    sourceQuotes?: string[];
  }>;
  selectedBlocks: string[];         // 선택된 블록 ID
  targetPlatforms: ContentFactoryPlatform[];
  targetAudience: TargetAudience;
  articleCount: number;             // 생성할 글감 수
}

// 글감 생성 결과
export interface BulkArticleResponse {
  articles: GeneratedArticle[];
  meta: {
    insightsUsed: number;
    blocksUsed: number;
    generatedAt: string;
  };
}
