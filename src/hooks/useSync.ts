'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import * as firestore from '@/lib/firebase/firestore'

// 오프라인 에러인지 확인
const isOfflineError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('offline') || error.message.includes('network')
  }
  return false
}

// localStorage 키들
const LOCAL_KEYS = {
  platforms: 'likethis_platforms',
  interests: 'likethis_interests',
  profileUrls: 'likethis_profile_urls',
  kakaoRooms: 'likethis_kakao_rooms',
  events: 'likethis_events',
  journeyTimerState: 'likethis_journey_timer_state',
  journeyFails: 'likethis_journey_fails',
}

export function useSync() {
  const { user } = useAuth()

  // 로컬 → 클라우드 동기화
  const syncToCloud = useCallback(async () => {
    if (!user) return

    // 오프라인 상태면 동기화 스킵
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return
    }

    try {
      // 설정 동기화 - undefined 필드는 제외
      const platforms = localStorage.getItem(LOCAL_KEYS.platforms)
      const interests = localStorage.getItem(LOCAL_KEYS.interests)
      const profileUrls = localStorage.getItem(LOCAL_KEYS.profileUrls)

      // 실제 값이 있는 필드만 객체에 포함
      const settings: Record<string, unknown> = {}
      if (platforms) settings.platforms = JSON.parse(platforms)
      if (interests) settings.interests = JSON.parse(interests)
      if (profileUrls) settings.profileUrls = JSON.parse(profileUrls)

      if (Object.keys(settings).length > 0) {
        await firestore.saveUserSettings(user.uid, settings)
      }

      // 카카오 방 동기화
      const kakaoRooms = localStorage.getItem(LOCAL_KEYS.kakaoRooms)
      if (kakaoRooms) {
        await firestore.saveKakaoRooms(user.uid, JSON.parse(kakaoRooms))
      }

      // 이벤트 동기화
      const events = localStorage.getItem(LOCAL_KEYS.events)
      if (events) {
        const parsed = JSON.parse(events)
        if (parsed.events) {
          await firestore.saveEvents(user.uid, parsed.events)
        }
      }

      // 활동 기록 동기화 (최근 30일)
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const key = `likethis_activities_${dateStr}`
        const data = localStorage.getItem(key)
        if (data) {
          await firestore.saveActivity(user.uid, dateStr, JSON.parse(data))
        }
      }

      // Journey 세션 동기화 (최근 7일 localStorage에서 -> Firestore)
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const key = `likethis_journey_sessions_${dateStr}`
        const data = localStorage.getItem(key)
        if (data) {
          const sessions = JSON.parse(data)
          for (const session of sessions) {
            if (session.id && session.endedAt) {
              await firestore.saveDeepWorkSession(user.uid, session)
            }
          }
        }
      }

      // Journey Fail logs 동기화
      const failLogs = localStorage.getItem(LOCAL_KEYS.journeyFails)
      if (failLogs) {
        const logs = JSON.parse(failLogs)
        for (const log of logs) {
          if (log.id) {
            await firestore.saveFailFastLog(user.uid, log)
          }
        }
      }

      console.log('Synced to cloud')
    } catch (error) {
      // 오프라인 에러는 조용히 무시
      if (!isOfflineError(error)) {
        console.error('Sync to cloud failed:', error)
      }
    }
  }, [user])

  // 클라우드 → 로컬 동기화 (로그인 시)
  const syncFromCloud = useCallback(async () => {
    if (!user) return

    // 오프라인 상태면 동기화 스킵
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return
    }

    try {
      // 설정 가져오기
      const settings = await firestore.getUserSettings(user.uid)
      if (settings) {
        if (settings.platforms) {
          localStorage.setItem(LOCAL_KEYS.platforms, JSON.stringify(settings.platforms))
        }
        if (settings.interests) {
          localStorage.setItem(LOCAL_KEYS.interests, JSON.stringify(settings.interests))
        }
        if (settings.profileUrls) {
          localStorage.setItem(LOCAL_KEYS.profileUrls, JSON.stringify(settings.profileUrls))
        }
      }

      // 카카오 방 가져오기
      const kakaoRooms = await firestore.getKakaoRooms(user.uid)
      if (kakaoRooms) {
        localStorage.setItem(LOCAL_KEYS.kakaoRooms, JSON.stringify(kakaoRooms))
      }

      // 이벤트 가져오기
      const events = await firestore.getEvents(user.uid)
      if (events && events.length > 0) {
        localStorage.setItem(LOCAL_KEYS.events, JSON.stringify({
          events,
          lastCrawled: new Date().toISOString()
        }))
      }

      console.log('Synced from cloud')
    } catch (error) {
      // 오프라인 에러는 조용히 무시
      if (!isOfflineError(error)) {
        console.error('Sync from cloud failed:', error)
      }
    }
  }, [user])

  // 카카오 방 즉시 동기화
  const syncKakaoRoomsNow = useCallback(async () => {
    if (!user) return

    // 오프라인 상태면 동기화 스킵
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return
    }

    try {
      const kakaoRooms = localStorage.getItem(LOCAL_KEYS.kakaoRooms)
      if (kakaoRooms) {
        await firestore.saveKakaoRooms(user.uid, JSON.parse(kakaoRooms))
        console.log('Kakao rooms synced immediately')
      }
    } catch (error) {
      if (!isOfflineError(error)) {
        console.error('Kakao rooms sync failed:', error)
      }
    }
  }, [user])

  // 이벤트 즉시 동기화 (병합 저장)
  const syncEventsNow = useCallback(async (newEvents?: unknown[]) => {
    if (!user) return null

    // 오프라인 상태면 동기화 스킵
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null
    }

    try {
      if (newEvents && newEvents.length > 0) {
        // 새 이벤트가 있으면 병합 저장
        const merged = await firestore.mergeAndSaveEvents(user.uid, newEvents as import('@/types').EventItem[])
        localStorage.setItem(LOCAL_KEYS.events, JSON.stringify({
          events: merged,
          lastCrawled: new Date().toISOString()
        }))
        console.log('Events merged and synced:', merged.length)
        return merged
      } else {
        // 새 이벤트 없으면 localStorage에서 클라우드로
        const events = localStorage.getItem(LOCAL_KEYS.events)
        if (events) {
          const parsed = JSON.parse(events)
          if (parsed.events) {
            await firestore.saveEvents(user.uid, parsed.events)
            console.log('Events synced to cloud')
          }
        }
        return null
      }
    } catch (error) {
      if (!isOfflineError(error)) {
        console.error('Events sync failed:', error)
      }
      return null
    }
  }, [user])

  // Journey 즉시 동기화
  const syncJourneyNow = useCallback(async () => {
    if (!user) return

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return
    }

    try {
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const key = `likethis_journey_sessions_${dateStr}`
      const data = localStorage.getItem(key)

      if (data) {
        const sessions = JSON.parse(data)
        for (const session of sessions) {
          if (session.id && session.endedAt) {
            await firestore.saveDeepWorkSession(user.uid, session)
          }
        }
        console.log('Journey sessions synced immediately')
      }

      // Fail logs
      const failLogs = localStorage.getItem(LOCAL_KEYS.journeyFails)
      if (failLogs) {
        const logs = JSON.parse(failLogs)
        for (const log of logs) {
          if (log.id) {
            await firestore.saveFailFastLog(user.uid, log)
          }
        }
        console.log('Journey fail logs synced immediately')
      }
    } catch (error) {
      if (!isOfflineError(error)) {
        console.error('Journey sync failed:', error)
      }
    }
  }, [user])

  // 로그인 시 클라우드에서 데이터 가져오기
  useEffect(() => {
    if (user) {
      syncFromCloud()
    }
  }, [user, syncFromCloud])

  return { syncToCloud, syncFromCloud, syncKakaoRoomsNow, syncEventsNow, syncJourneyNow }
}
