import { db } from './config'
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import type { TrendCollection, TrendItem, EventItem, NewsTrendItem } from '@/types'

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
  category: 'tech' | 'business' | 'resource' | 'tip'
  title: string
  content: string
  tags: string[]
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
