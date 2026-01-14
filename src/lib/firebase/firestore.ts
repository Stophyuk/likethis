import { db } from './config'
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import type { TrendCollection, TrendItem } from '@/types'

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
