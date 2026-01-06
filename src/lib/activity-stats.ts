import { PLATFORM_GUIDES } from './platform-guides'
import type { Platform } from '@/types'

// 날짜 키 생성
function getDateKey(date: Date): string {
  return `likethis_activities_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 특정 날짜의 활동 데이터 가져오기
export function getActivityForDate(date: Date): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  const key = getDateKey(date)
  const saved = localStorage.getItem(key)
  return saved ? JSON.parse(saved) : {}
}

// 기간 내 총 활동 수 계산
export function getTotalActivities(startDate: Date, endDate: Date): number {
  let total = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const data = getActivityForDate(current)
    Object.values(data).forEach(arr => {
      total += arr.length
    })
    current.setDate(current.getDate() + 1)
  }
  return total
}

// 주간 비교
export function getWeeklyComparison() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())

  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

  const thisWeek = getTotalActivities(thisWeekStart, today)
  const lastWeek = getTotalActivities(lastWeekStart, lastWeekEnd)

  return { thisWeek, lastWeek, diff: thisWeek - lastWeek }
}

// 플랫폼별 통계 (최근 N일)
export function getPlatformStats(days: number) {
  const platforms = Object.keys(PLATFORM_GUIDES) as Platform[]
  const stats: Record<string, number> = {}
  platforms.forEach(p => stats[p] = 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const data = getActivityForDate(date)
    Object.entries(data).forEach(([platform, arr]) => {
      if (stats[platform] !== undefined) {
        stats[platform] += arr.length
      }
    })
  }

  return Object.entries(stats)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
}

// 비활성 플랫폼 찾기 (N일 이상 활동 없음)
export function getInactivePlatforms(days: number): string[] {
  if (typeof window === 'undefined') return []
  const saved = localStorage.getItem('likethis_platforms')
  const activePlatforms = saved ? JSON.parse(saved) : {}

  const enabledPlatforms = Object.entries(activePlatforms)
    .filter(([_, enabled]) => enabled)
    .map(([p]) => p)

  const stats = getPlatformStats(days)
  return enabledPlatforms.filter(p => {
    const stat = stats.find(s => s.platform === p)
    return !stat || stat.count === 0
  })
}

// 활동 일수 계산 (최근 N일 중)
export function getActiveDays(days: number): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let count = 0

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const data = getActivityForDate(date)
    const hasActivity = Object.values(data).some(arr => arr.length > 0)
    if (hasActivity) count++
  }
  return count
}

// 타임라인 데이터
export interface TimelineItem {
  date: Date
  dateStr: string
  activities: { platform: string; items: string[] }[]
}

export function getActivityTimeline(days: number): TimelineItem[] {
  const timeline: TimelineItem[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const data = getActivityForDate(date)

    const activities = Object.entries(data)
      .filter(([_, items]) => items.length > 0)
      .map(([platform, items]) => ({ platform, items }))

    if (activities.length > 0) {
      const weekdays = ['일', '월', '화', '수', '목', '금', '토']
      timeline.push({
        date,
        dateStr: `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`,
        activities
      })
    }
  }
  return timeline
}
