import { db } from './config'
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import type { TrendCollection, TrendItem, EventItem, NewsTrendItem, DeepWorkSession, FailFastLog, DailyReflection, JourneyDayStats, Venture, PersonalMonopoly, IncubatorIdea } from '@/types'

// ===== 설정 =====
export async function saveUserSettings(uid: string, settings: {
  platforms?: Record<string, boolean>
  interests?: string[]
  profileUrls?: Record<string, string>
}) {
  const ref = doc(db, 'users', uid, 'data', 'settings')
  await setDoc(ref, settings, { merge: true })
}

export async function getUserSettings(uid: string) {
  const ref = doc(db, 'users', uid, 'data', 'settings')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

// ===== 활동 기록 =====
export async function saveActivity(uid: string, date: string, data: Record<string, string[]>) {
  const ref = doc(db, 'users', uid, 'activities', date)
  await setDoc(ref, { data, updatedAt: new Date().toISOString() })
}

export async function getActivity(uid: string, date: string) {
  const ref = doc(db, 'users', uid, 'activities', date)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data()?.data : null
}

// ===== 초기 세팅 진행상황 =====
export async function saveSetupProgress(uid: string, platform: string, completed: string[]) {
  const ref = doc(db, 'users', uid, 'setup', platform)
  await setDoc(ref, { completed, updatedAt: new Date().toISOString() })
}

export async function getSetupProgress(uid: string, platform: string) {
  const ref = doc(db, 'users', uid, 'setup', platform)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data()?.completed : []
}

// ===== 카카오 방 =====
export async function saveKakaoRooms(uid: string, rooms: unknown[]) {
  const ref = doc(db, 'users', uid, 'data', 'kakaoRooms')
  await setDoc(ref, { rooms, updatedAt: new Date().toISOString() })
}

export async function getKakaoRooms(uid: string) {
  const ref = doc(db, 'users', uid, 'data', 'kakaoRooms')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data()?.rooms : null
}

// ===== 분석 히스토리 =====
export async function saveAnalysisHistory(uid: string, roomId: string, analysis: Record<string, unknown>) {
  const id = `${roomId}_${Date.now()}`
  const ref = doc(db, 'users', uid, 'analysisHistory', id)
  await setDoc(ref, { ...analysis, id, roomId })
  return id
}

export async function getAnalysisHistory(uid: string, roomId: string) {
  const ref = collection(db, 'users', uid, 'analysisHistory')
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => d.data())
    .filter(d => d.roomId === roomId)
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
}

// ===== 트렌드 컬렉션 =====
export async function saveTrendCollection(uid: string, trendCollection: TrendCollection) {
  const ref = doc(db, 'users', uid, 'trends', trendCollection.id)
  await setDoc(ref, { ...trendCollection, updatedAt: new Date().toISOString() })
  return trendCollection.id
}

export async function getTrendCollection(uid: string, id: string) {
  const ref = doc(db, 'users', uid, 'trends', id)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() as TrendCollection : null
}

export async function getTrendCollections(uid: string, limitCount: number = 30) {
  const ref = collection(db, 'users', uid, 'trends')
  const q = query(ref, orderBy('date', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as TrendCollection)
}

export async function addTrendItem(uid: string, date: string, item: TrendItem) {
  const id = date
  const existing = await getTrendCollection(uid, id)

  if (existing) {
    existing.items.push(item)
    await saveTrendCollection(uid, existing)
  } else {
    const newCollection: TrendCollection = {
      id,
      date,
      items: [item],
    }
    await saveTrendCollection(uid, newCollection)
  }
  return id
}

// ===== 이벤트 =====
export async function saveEvents(uid: string, events: EventItem[]) {
  const ref = doc(db, 'users', uid, 'data', 'events')
  await setDoc(ref, {
    events,
    updatedAt: new Date().toISOString(),
    count: events.length
  })
}

export async function getEvents(uid: string): Promise<EventItem[]> {
  const ref = doc(db, 'users', uid, 'data', 'events')
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data()?.events || []) : []
}

// 새 이벤트와 기존 이벤트 병합 (ID 기준 중복 제거)
export async function mergeAndSaveEvents(uid: string, newEvents: EventItem[]): Promise<EventItem[]> {
  const existingEvents = await getEvents(uid)

  // ID 기준으로 병합 (새 이벤트가 기존 이벤트 덮어씀)
  const eventMap = new Map<string, EventItem>()
  for (const event of existingEvents) {
    eventMap.set(event.id, event)
  }
  for (const event of newEvents) {
    eventMap.set(event.id, event)
  }

  const mergedEvents = Array.from(eventMap.values())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())

  await saveEvents(uid, mergedEvents)
  return mergedEvents
}

// ===== 카카오 채팅 메시지 축적 =====
export interface ChatMessage {
  date: string
  user: string
  message: string
}

export interface RoomChatData {
  messages: ChatMessage[]
  totalCount: number
  firstDate?: string
  lastDate?: string
  updatedAt: string
}

// 채팅 메시지 저장 (병합)
export async function saveChatMessages(uid: string, roomId: string, newMessages: ChatMessage[]): Promise<RoomChatData> {
  const existing = await getChatMessages(uid, roomId)

  // 중복 제거를 위한 키 생성 (날짜+사용자+메시지 해시)
  const messageKey = (m: ChatMessage) => `${m.date}|${m.user}|${m.message.substring(0, 50)}`

  const messageMap = new Map<string, ChatMessage>()
  for (const msg of existing.messages) {
    messageMap.set(messageKey(msg), msg)
  }
  for (const msg of newMessages) {
    messageMap.set(messageKey(msg), msg)
  }

  // 날짜순 정렬
  const mergedMessages = Array.from(messageMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const chatData: RoomChatData = {
    messages: mergedMessages,
    totalCount: mergedMessages.length,
    firstDate: mergedMessages[0]?.date,
    lastDate: mergedMessages[mergedMessages.length - 1]?.date,
    updatedAt: new Date().toISOString(),
  }

  const ref = doc(db, 'users', uid, 'kakaoChats', roomId)
  await setDoc(ref, chatData)

  return chatData
}

// 채팅 메시지 불러오기
export async function getChatMessages(uid: string, roomId: string): Promise<RoomChatData> {
  const ref = doc(db, 'users', uid, 'kakaoChats', roomId)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return snap.data() as RoomChatData
  }

  return {
    messages: [],
    totalCount: 0,
    updatedAt: new Date().toISOString(),
  }
}

// 채팅 메시지 삭제
export async function deleteChatMessages(uid: string, roomId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'kakaoChats', roomId)
  await setDoc(ref, {
    messages: [],
    totalCount: 0,
    updatedAt: new Date().toISOString(),
  })
}

// ===== 인사이트 히스토리 =====
export interface Insight {
  category: 'command' | 'number' | 'solution' | 'tool' | 'trend' | 'business' | 'tech' | 'resource' | 'tip'
  title: string
  content: string
  tags: string[]
  sourceQuotes?: string[]
  extractedAt?: string
}

export interface InsightHistory {
  id: string
  roomId: string
  analyzedAt: string
  messageCount: number
  insights: Insight[]
  summary: string
  resources: string[]
}

// 인사이트 히스토리 저장 (중복 제거)
export async function saveInsightHistory(
  uid: string,
  roomId: string,
  insights: Insight[],
  summary: string,
  resources: string[],
  messageCount: number
): Promise<InsightHistory> {
  // 기존 인사이트 가져오기
  const existingHistory = await getInsightHistoryAll(uid, roomId)
  const existingInsights = existingHistory.flatMap(h => h.insights)

  // 중복 제거 (제목 유사도 기준)
  const newInsights = insights.filter(newInsight => {
    const normalizedNew = newInsight.title.toLowerCase().trim()
    return !existingInsights.some(existing => {
      const normalizedExisting = existing.title.toLowerCase().trim()
      return normalizedNew === normalizedExisting ||
        similarity(normalizedNew, normalizedExisting) > 0.8
    })
  })

  const id = `${roomId}_${Date.now()}`
  const historyEntry: InsightHistory = {
    id,
    roomId,
    analyzedAt: new Date().toISOString(),
    messageCount,
    insights: newInsights,
    summary,
    resources,
  }

  const ref = doc(db, 'users', uid, 'insightHistory', id)
  await setDoc(ref, historyEntry)

  return historyEntry
}

// 문자열 유사도 계산 (간단한 Jaccard 유사도)
function similarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/))
  const setB = new Set(b.split(/\s+/))
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}

// 특정 방의 인사이트 히스토리 전체 가져오기
export async function getInsightHistoryAll(uid: string, roomId: string): Promise<InsightHistory[]> {
  const ref = collection(db, 'users', uid, 'insightHistory')
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => d.data() as InsightHistory)
    .filter(d => d.roomId === roomId)
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
}

// 특정 방의 모든 인사이트 합쳐서 가져오기 (중복 제거됨)
export async function getAllInsights(uid: string, roomId: string): Promise<{
  insights: Insight[]
  totalAnalyses: number
  lastAnalyzedAt: string | null
}> {
  const history = await getInsightHistoryAll(uid, roomId)

  // 모든 인사이트 합치기 (최신 것 우선)
  const allInsights: Insight[] = []
  const seenTitles = new Set<string>()

  for (const h of history) {
    for (const insight of h.insights) {
      const normalizedTitle = insight.title.toLowerCase().trim()
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle)
        allInsights.push(insight)
      }
    }
  }

  return {
    insights: allInsights,
    totalAnalyses: history.length,
    lastAnalyzedAt: history[0]?.analyzedAt || null,
  }
}

// 인사이트 히스토리 삭제
export async function deleteInsightHistory(uid: string, roomId: string): Promise<void> {
  const history = await getInsightHistoryAll(uid, roomId)
  for (const h of history) {
    const ref = doc(db, 'users', uid, 'insightHistory', h.id)
    await setDoc(ref, { deleted: true })
  }
}

// ===== 뉴스/트렌드 =====
export interface NewsTrendData {
  items: NewsTrendItem[]
  crawledAt: string
  totalCount: number
}

// 뉴스 트렌드 저장
export async function saveNewsTrends(uid: string, items: NewsTrendItem[]): Promise<NewsTrendData> {
  const existing = await getNewsTrends(uid)

  // ID 기준 중복 제거 (새 아이템이 우선)
  const itemMap = new Map<string, NewsTrendItem>()
  for (const item of existing.items) {
    itemMap.set(item.id, item)
  }
  for (const item of items) {
    itemMap.set(item.id, item)
  }

  // 최근 500개만 유지 (점수 순 정렬 후)
  const mergedItems = Array.from(itemMap.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 500)

  const trendData: NewsTrendData = {
    items: mergedItems,
    crawledAt: new Date().toISOString(),
    totalCount: mergedItems.length,
  }

  const ref = doc(db, 'users', uid, 'data', 'newsTrends')
  await setDoc(ref, trendData)

  return trendData
}

// 뉴스 트렌드 가져오기
export async function getNewsTrends(uid: string): Promise<NewsTrendData> {
  const ref = doc(db, 'users', uid, 'data', 'newsTrends')
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return snap.data() as NewsTrendData
  }

  return {
    items: [],
    crawledAt: '',
    totalCount: 0,
  }
}

// 플랫폼별 트렌드 가져오기
export async function getNewsTrendsByPlatform(uid: string, platform: string): Promise<NewsTrendItem[]> {
  const trends = await getNewsTrends(uid)
  return trends.items.filter(item => item.platform === platform)
}

// ===== 포스팅 히스토리 =====
import type { PostingHistory, PlatformContent } from '@/types'

// 포스팅 히스토리 저장
export async function savePostingHistory(
  uid: string,
  topic: string,
  keyPoints: string,
  originalDraft: string,
  platformContents: PlatformContent[]
): Promise<string> {
  const id = `post_${Date.now()}`
  const history: PostingHistory = {
    id,
    topic,
    keyPoints,
    originalDraft,
    platformContents,
    createdAt: new Date().toISOString(),
  }

  const ref = doc(db, 'users', uid, 'postingHistory', id)
  await setDoc(ref, history)
  return id
}

// 포스팅 히스토리 목록 가져오기
export async function getPostingHistoryList(uid: string, limitCount: number = 50): Promise<PostingHistory[]> {
  const ref = collection(db, 'users', uid, 'postingHistory')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as PostingHistory)
}

// 포스팅 히스토리 상세 가져오기
export async function getPostingHistory(uid: string, id: string): Promise<PostingHistory | null> {
  const ref = doc(db, 'users', uid, 'postingHistory', id)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() as PostingHistory : null
}

// 포스팅 히스토리 삭제
export async function deletePostingHistory(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'postingHistory', id)
  await setDoc(ref, { deleted: true, deletedAt: new Date().toISOString() }, { merge: true })
}

// 플랫폼 컨텐츠 포스팅 시간 업데이트
export async function markAsPosted(uid: string, historyId: string, platform: string): Promise<void> {
  const history = await getPostingHistory(uid, historyId)
  if (!history) return

  const updatedContents = history.platformContents.map(pc =>
    pc.platform === platform ? { ...pc, postedAt: new Date().toISOString() } : pc
  )

  const ref = doc(db, 'users', uid, 'postingHistory', historyId)
  await setDoc(ref, { platformContents: updatedContents }, { merge: true })
}

// ===== AI 글감 생성 =====
import type { TopicSuggestion, TopicHistory } from '@/types'

// 전체 방의 인사이트 조회
export async function getAllRoomsInsights(uid: string): Promise<{
  insights: (Insight & { roomId: string; roomName?: string })[]
  roomInsightCounts: Record<string, number>
  totalAnalyses: number
}> {
  const ref = collection(db, 'users', uid, 'insightHistory')
  const snap = await getDocs(ref)

  const allHistories = snap.docs
    .map(d => d.data() as InsightHistory)
    .filter(d => !('deleted' in d && d.deleted))
    .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())

  // 모든 인사이트 합치기 (중복 제거)
  const insights: (Insight & { roomId: string; roomName?: string })[] = []
  const seenTitles = new Set<string>()
  const roomInsightCounts: Record<string, number> = {}

  for (const history of allHistories) {
    roomInsightCounts[history.roomId] = (roomInsightCounts[history.roomId] || 0) + history.insights.length

    for (const insight of history.insights) {
      const normalizedTitle = insight.title.toLowerCase().trim()
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle)
        insights.push({
          ...insight,
          roomId: history.roomId,
        })
      }
    }
  }

  return {
    insights,
    roomInsightCounts,
    totalAnalyses: allHistories.length,
  }
}

// 글감 히스토리 저장
export async function saveTopicHistory(
  uid: string,
  topics: TopicSuggestion[],
  insightSummary: string,
  totalInsightsUsed: number,
  roomsUsed: string[]
): Promise<string> {
  const id = `topic_${Date.now()}`
  const history: TopicHistory = {
    id,
    topics,
    insightSummary,
    totalInsightsUsed,
    roomsUsed,
    generatedAt: new Date().toISOString(),
    status: 'generated',
  }

  const ref = doc(db, 'users', uid, 'topicHistory', id)
  await setDoc(ref, history)
  return id
}

// 글감 히스토리 목록 가져오기
export async function getTopicHistoryList(uid: string, limitCount: number = 50): Promise<TopicHistory[]> {
  const ref = collection(db, 'users', uid, 'topicHistory')
  const q = query(ref, orderBy('generatedAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => d.data() as TopicHistory)
    .filter(d => !('deleted' in d && d.deleted))
}

// 글감 히스토리 상세 가져오기
export async function getTopicHistory(uid: string, id: string): Promise<TopicHistory | null> {
  const ref = doc(db, 'users', uid, 'topicHistory', id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data() as TopicHistory & { deleted?: boolean }
    if (data.deleted) return null
    return data
  }
  return null
}

// 글감 히스토리 삭제
export async function deleteTopicHistory(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'topicHistory', id)
  await setDoc(ref, { deleted: true, deletedAt: new Date().toISOString() }, { merge: true })
}

// 글감 히스토리 상태 업데이트
export async function updateTopicHistoryStatus(
  uid: string,
  id: string,
  status: TopicHistory['status']
): Promise<void> {
  const ref = doc(db, 'users', uid, 'topicHistory', id)
  await setDoc(ref, { status, updatedAt: new Date().toISOString() }, { merge: true })
}

// ===== 작성 템플릿 =====
import type { ComposeTemplate } from '@/types'

// 템플릿 저장
export async function saveComposeTemplate(
  uid: string,
  name: string,
  topic: string,
  keyPoints: string,
  bilingual: boolean
): Promise<string> {
  const id = `template_${Date.now()}`
  const template: ComposeTemplate = {
    id,
    name,
    topic,
    keyPoints,
    bilingual,
    createdAt: new Date().toISOString(),
    usedCount: 0,
  }

  const ref = doc(db, 'users', uid, 'composeTemplates', id)
  await setDoc(ref, template)
  return id
}

// 템플릿 목록 가져오기
export async function getComposeTemplates(uid: string, limitCount: number = 50): Promise<ComposeTemplate[]> {
  const ref = collection(db, 'users', uid, 'composeTemplates')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => d.data() as ComposeTemplate & { deleted?: boolean })
    .filter(d => !d.deleted)
}

// 템플릿 삭제
export async function deleteComposeTemplate(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'composeTemplates', id)
  await setDoc(ref, { deleted: true, deletedAt: new Date().toISOString() }, { merge: true })
}

// 템플릿 사용 횟수 증가
export async function incrementTemplateUsage(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'composeTemplates', id)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const data = snap.data() as ComposeTemplate
    await setDoc(ref, { usedCount: (data.usedCount || 0) + 1 }, { merge: true })
  }
}

// ===== Journey (Deep Work Logger) =====

// Save deep work session
export async function saveDeepWorkSession(uid: string, session: DeepWorkSession): Promise<string> {
  const ref = doc(db, 'users', uid, 'journey/sessions', session.id)
  await setDoc(ref, session)
  return session.id
}

// Get deep work sessions by date
export async function getDeepWorkSessions(uid: string, date: string): Promise<DeepWorkSession[]> {
  const ref = collection(db, 'users', uid, 'journey/sessions')
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => d.data() as DeepWorkSession)
    .filter(s => s.startedAt.startsWith(date))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
}

// Get all deep work sessions (with limit)
export async function getAllDeepWorkSessions(uid: string, limitCount: number = 100): Promise<DeepWorkSession[]> {
  const ref = collection(db, 'users', uid, 'journey/sessions')
  const q = query(ref, orderBy('startedAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as DeepWorkSession)
}

// Save fail-fast log
export async function saveFailFastLog(uid: string, log: FailFastLog): Promise<string> {
  const ref = doc(db, 'users', uid, 'journey/fails', log.id)
  await setDoc(ref, log)
  return log.id
}

// Get fail-fast logs
export async function getFailFastLogs(uid: string, limitCount: number = 50): Promise<FailFastLog[]> {
  const ref = collection(db, 'users', uid, 'journey/fails')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as FailFastLog)
}

// Get fail-fast logs by date
export async function getFailFastLogsByDate(uid: string, date: string): Promise<FailFastLog[]> {
  const ref = collection(db, 'users', uid, 'journey/fails')
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => d.data() as FailFastLog)
    .filter(l => l.createdAt.startsWith(date))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Save daily reflection
export async function saveDailyReflection(uid: string, reflection: DailyReflection): Promise<string> {
  const ref = doc(db, 'users', uid, 'journey/reflections', reflection.date)
  await setDoc(ref, reflection)
  return reflection.id
}

// Get daily reflection
export async function getDailyReflection(uid: string, date: string): Promise<DailyReflection | null> {
  const ref = doc(db, 'users', uid, 'journey/reflections', date)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() as DailyReflection : null
}

// Get journey day stats
export async function getJourneyDayStats(uid: string, date: string): Promise<JourneyDayStats> {
  const [sessions, failLogs, reflection] = await Promise.all([
    getDeepWorkSessions(uid, date),
    getFailFastLogsByDate(uid, date),
    getDailyReflection(uid, date),
  ])

  let totalPureMinutes = 0
  let totalAiAssistedMinutes = 0

  for (const session of sessions) {
    if (session.duration) {
      const minutes = Math.round(session.duration / 60)
      if (session.mode === 'pure') {
        totalPureMinutes += minutes
      } else {
        totalAiAssistedMinutes += minutes
      }
    }
  }

  return {
    date,
    totalPureMinutes,
    totalAiAssistedMinutes,
    sessionCount: sessions.length,
    failLogCount: failLogs.length,
    hasReflection: !!reflection,
  }
}

// Get journey stats for date range
export async function getJourneyStatsRange(
  uid: string,
  startDate: string,
  endDate: string
): Promise<JourneyDayStats[]> {
  const stats: JourneyDayStats[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayStat = await getJourneyDayStats(uid, dateStr)
    if (dayStat.sessionCount > 0 || dayStat.failLogCount > 0 || dayStat.hasReflection) {
      stats.push(dayStat)
    }
  }

  return stats
}

// ===== Ventures (Personal Holding Dashboard) =====

// Save venture
export async function saveVenture(uid: string, venture: Venture): Promise<string> {
  const ref = doc(db, 'users', uid, 'ventures', venture.id)
  await setDoc(ref, {
    ...venture,
    updatedAt: new Date().toISOString(),
  })
  return venture.id
}

// Get venture by ID
export async function getVenture(uid: string, id: string): Promise<Venture | null> {
  const ref = doc(db, 'users', uid, 'ventures', id)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() as Venture : null
}

// Get all ventures
export async function getVentures(uid: string): Promise<Venture[]> {
  const ref = collection(db, 'users', uid, 'ventures')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => d.data() as Venture)
    .filter(v => v.status !== 'archived')
}

// Get ventures by status
export async function getVenturesByStatus(uid: string, status: Venture['status']): Promise<Venture[]> {
  const ventures = await getVentures(uid)
  return ventures.filter(v => v.status === status)
}

// Delete venture (archive it)
export async function archiveVenture(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'ventures', id)
  await setDoc(ref, {
    status: 'archived',
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

// Save personal monopoly
export async function savePersonalMonopoly(uid: string, monopoly: PersonalMonopoly): Promise<void> {
  const ref = doc(db, 'users', uid, 'data', 'personalMonopoly')
  await setDoc(ref, {
    ...monopoly,
    updatedAt: new Date().toISOString(),
  })
}

// Get personal monopoly
export async function getPersonalMonopoly(uid: string): Promise<PersonalMonopoly | null> {
  const ref = doc(db, 'users', uid, 'data', 'personalMonopoly')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() as PersonalMonopoly : null
}

// Save incubator idea
export async function saveIncubatorIdea(uid: string, idea: IncubatorIdea): Promise<string> {
  const ref = doc(db, 'users', uid, 'incubator', idea.id)
  await setDoc(ref, {
    ...idea,
    updatedAt: new Date().toISOString(),
  })
  return idea.id
}

// Get incubator idea
export async function getIncubatorIdea(uid: string, id: string): Promise<IncubatorIdea | null> {
  const ref = doc(db, 'users', uid, 'incubator', id)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() as IncubatorIdea : null
}

// Get all incubator ideas
export async function getIncubatorIdeas(uid: string): Promise<IncubatorIdea[]> {
  const ref = collection(db, 'users', uid, 'incubator')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => d.data() as IncubatorIdea)
    .filter(i => i.stage !== 'converted')
}

// Convert idea to venture
export async function convertIdeaToVenture(
  uid: string,
  ideaId: string,
  ventureName: string,
  description: string
): Promise<string> {
  const idea = await getIncubatorIdea(uid, ideaId)
  if (!idea) {
    throw new Error('Idea not found')
  }

  // Create venture from idea
  const ventureId = `venture_${Date.now()}`
  const venture: Venture = {
    id: ventureId,
    name: ventureName,
    description,
    status: 'idea',
    monopolyContribution: idea.uniqueValue || '',
    linkedPostingIds: [],
    tags: [],
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save venture
  await saveVenture(uid, venture)

  // Update idea status
  await setDoc(doc(db, 'users', uid, 'incubator', ideaId), {
    stage: 'converted',
    convertedToVentureId: ventureId,
    updatedAt: new Date().toISOString(),
  }, { merge: true })

  return ventureId
}

// Delete incubator idea
export async function deleteIncubatorIdea(uid: string, id: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'incubator', id)
  await setDoc(ref, {
    stage: 'converted',  // Mark as converted to hide it
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}
