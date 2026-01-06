'use client'

import { useState, useEffect } from 'react'
import { PLATFORM_GUIDES } from '@/lib/platform-guides'
import { ExternalLink } from 'lucide-react'

function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    x: '𝕏', producthunt: '🚀', medium: '📝', naver: '🟢',
    youtube: '▶️', instagram: '📸', reddit: '🤖', linkedin: '💼',
    indiehackers: '🛠️', kakao: '💬',
  }
  return emojis[platform] || '📱'
}

export function MyPlatformLinks() {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('likethis_profile_urls')
    if (saved) {
      setUrls(JSON.parse(saved))
    }
  }, [])

  // storage 이벤트 리스닝 (다른 탭에서 변경 시)
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('likethis_profile_urls')
      if (saved) setUrls(JSON.parse(saved))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  if (!mounted) return null

  const platformsWithUrls = Object.entries(urls).filter(([_, url]) => url && url.trim())

  if (platformsWithUrls.length === 0) {
    return (
      <div className="p-4 border-t">
        <p className="text-xs text-gray-400 mb-2">내 플랫폼</p>
        <p className="text-xs text-gray-400">설정에서 URL을 추가하세요</p>
      </div>
    )
  }

  return (
    <div className="p-4 border-t">
      <p className="text-xs text-gray-400 mb-2">내 플랫폼</p>
      <div className="space-y-1">
        {platformsWithUrls.map(([platform, url]) => {
          const guide = PLATFORM_GUIDES[platform as keyof typeof PLATFORM_GUIDES]
          return (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <span>{getPlatformEmoji(platform)}</span>
              <span className="flex-1 truncate">{guide?.name?.split(' ')[0] || platform}</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
