'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import * as firestore from '@/lib/firebase/firestore'

// localStorage 키들
const LOCAL_KEYS = {
  platforms: 'likethis_platforms',
  interests: 'likethis_interests',
  profileUrls: 'likethis_profile_urls',
  kakaoRooms: 'likethis_kakao_rooms',
}

export function useSync() {
  const { user } = useAuth()

  // 로컬 → 클라우드 동기화
  const syncToCloud = useCallback(async () => {
    if (!user) return

    try {
      // 설정 동기화
      const platforms = localStorage.getItem(LOCAL_KEYS.platforms)
      const interests = localStorage.getItem(LOCAL_KEYS.interests)
      const profileUrls = localStorage.getItem(LOCAL_KEYS.profileUrls)

      if (platforms || interests || profileUrls) {
        await firestore.saveUserSettings(user.uid, {
          platforms: platforms ? JSON.parse(platforms) : undefined,
          interests: interests ? JSON.parse(interests) : undefined,
          profileUrls: profileUrls ? JSON.parse(profileUrls) : undefined,
        })
      }

      // 카카오 방 동기화
      const kakaoRooms = localStorage.getItem(LOCAL_KEYS.kakaoRooms)
      if (kakaoRooms) {
        await firestore.saveKakaoRooms(user.uid, JSON.parse(kakaoRooms))
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

      console.log('Synced to cloud')
    } catch (error) {
      console.error('Sync to cloud failed:', error)
    }
  }, [user])

  // 클라우드 → 로컬 동기화 (로그인 시)
  const syncFromCloud = useCallback(async () => {
    if (!user) return

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

      console.log('Synced from cloud')
    } catch (error) {
      console.error('Sync from cloud failed:', error)
    }
  }, [user])

  // 로그인 시 클라우드에서 데이터 가져오기
  useEffect(() => {
    if (user) {
      syncFromCloud()
    }
  }, [user, syncFromCloud])

  return { syncToCloud, syncFromCloud }
}
