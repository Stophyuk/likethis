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
}
