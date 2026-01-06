import { db } from './config'
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'

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
