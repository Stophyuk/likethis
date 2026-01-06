import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPlatformList } from '@/lib/platform-guides'

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
      <div>
        <h1 className="text-3xl font-bold">플랫폼 가이드</h1>
        <p className="text-gray-600 mt-2">
          각 플랫폼별 활동 전략과 팁을 확인하세요
        </p>
      </div>

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
