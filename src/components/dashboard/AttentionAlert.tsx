'use client'

import { useState, useEffect } from 'react'
import { getInactivePlatforms } from '@/lib/activity-stats'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import { AlertTriangle, X } from 'lucide-react'

export function AttentionAlert() {
  const [inactivePlatforms, setInactivePlatforms] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const inactive = getInactivePlatforms(3)
    setInactivePlatforms(inactive.slice(0, 2))
  }, [])

  if (dismissed || inactivePlatforms.length === 0) return null

  const platformNames = inactivePlatforms.map(p =>
    PLATFORM_GUIDES[p as keyof typeof PLATFORM_GUIDES]?.name?.split(' ')[0] || p
  ).join(', ')

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-amber-800">
          <strong>{platformNames}</strong> 활동이 3일째 없어요!
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          오늘 잠깐이라도 들러보는 건 어때요?
        </p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
