import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'
import { getPlatformGuide, PLATFORM_GUIDES } from '@/lib/platform-guides'
import { SetupChecklist } from '@/components/guide/SetupChecklist'

const platformEmojis: Record<string, string> = {
  X: '𝕏',
  Threads: '🧵',
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

export function generateStaticParams() {
  return Object.keys(PLATFORM_GUIDES).map((platform) => ({
    platform,
  }))
}

export default async function PlatformGuidePage({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await params
  const guide = getPlatformGuide(platform)

  if (!guide) {
    notFound()
  }

  const emoji = platformEmojis[guide.icon] || '📱'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-5xl">{emoji}</span>
        <div>
          <h1 className="text-3xl font-bold">{guide.name}</h1>
          <p className="text-gray-600">{guide.description}</p>
        </div>
      </div>

      {/* 초기 세팅 가이드 */}
      {guide.setupGuide && guide.setupGuide.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              초기 세팅 가이드
            </CardTitle>
            <CardDescription>
              처음 시작할 때 이것들부터 세팅하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SetupChecklist platform={platform} items={guide.setupGuide} />
          </CardContent>
        </Card>
      )}

      {/* 목표 섹션 */}
      <div className="grid gap-4 md:grid-cols-3">
        {guide.defaultDailyGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">일일 목표</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guide.defaultDailyGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Badge>{goal.type}</Badge>
                    <span>{goal.count}개</span>
                    {goal.description && (
                      <span className="text-sm text-gray-500">- {goal.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {guide.defaultWeeklyGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">주간 목표</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guide.defaultWeeklyGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Badge variant="outline">{goal.type}</Badge>
                    <span>{goal.count}개</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {guide.defaultMonthlyGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">월간 목표</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {guide.defaultMonthlyGoals.map((goal, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Badge variant="secondary">{goal.type}</Badge>
                    <span>{goal.count}개</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 팁 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>활동 팁</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            {guide.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 댓글 템플릿 */}
      {guide.commentTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>댓글 템플릿</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guide.commentTemplates.map((template, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                  &quot;{template}&quot;
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 해시태그 */}
      {guide.hashtagSuggestions && guide.hashtagSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>추천 해시태그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {guide.hashtagSuggestions.map((tag, idx) => (
                <Badge key={idx} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 성장 전략 */}
      <Card>
        <CardHeader>
          <CardTitle>성장 전략</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-decimal list-inside">
            {guide.growthStrategy.map((strategy, idx) => (
              <li key={idx}>{strategy}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
