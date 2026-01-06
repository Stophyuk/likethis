'use client'

import { useEffect } from 'react'
import { useSync } from '@/hooks/useSync'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { syncToCloud } = useSync()

  // 5분마다 클라우드에 동기화
  useEffect(() => {
    const interval = setInterval(() => {
      syncToCloud()
    }, 5 * 60 * 1000)

    // 페이지 떠날 때 동기화
    const handleBeforeUnload = () => {
      syncToCloud()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [syncToCloud])

  return <>{children}</>
}
