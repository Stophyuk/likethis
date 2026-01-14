// 플랫폼 타입
export type Platform =
  | 'x'
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
