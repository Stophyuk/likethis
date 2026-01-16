import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPlatformList } from '@/lib/platform-guides'
import { Sparkles } from 'lucide-react'

const platformEmojis: Record<string, string> = {
  X: '𝕏',
  ProductHunt: '🚀',
  Medium: '📝',
  Naver: '🟢',
  Youtube: '▶️',
  Instagram: '📸',
  Reddit: '🤖',
  Linkedin: '💼',
  IndieHackers: '🛠️',
  Kakao: '💬',
}

export default function GuidePage() {
  const platforms = getPlatformList()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">플랫폼 가이드</h1>
          <p className="text-gray-600 mt-2">
            각 플랫폼별 활동 전략과 팁을 확인하세요
          </p>
        </div>
        <Link href="/dashboard/guide/profile">
          <Button>
            <Sparkles className="w-4 h-4 mr-2" />
            AI 프로필 생성
          </Button>
        </Link>
      </div>

      {/* AI 프로필 가이드 배너 */}
      <Link href="/dashboard/guide/profile">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-lg transition-shadow cursor-pointer border-purple-100">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">✨</div>
              <div>
                <h3 className="font-semibold text-lg">맞춤형 프로필 가이드</h3>
                <p className="text-gray-600 text-sm">
                  AI가 각 플랫폼에 최적화된 프로필 바이오, 사진 팁, 링크 추천을 제공합니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <Link href={`/dashboard/guide/${platform.platform}`} key={platform.platform}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{platformEmojis[platform.icon] || '📱'}</span>
                  {platform.name}
                </CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {platform.defaultDailyGoals.length > 0 && (
                    <Badge variant="secondary">일일</Badge>
                  )}
                  {platform.defaultWeeklyGoals.length > 0 && (
                    <Badge variant="outline">주간</Badge>
                  )}
                  {platform.defaultMonthlyGoals.length > 0 && (
                    <Badge variant="outline">월간</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
