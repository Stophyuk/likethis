import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to LikeThis</h1>
        <p className="text-gray-600 mt-2">
          이성에게 호감을 얻는 대화법을 배워보세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>가이드</CardTitle>
            <CardDescription>
              플랫폼별 대화 가이드를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              소개팅 앱, 카카오톡 등 다양한 플랫폼에서의 대화 전략을 배워보세요.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>카톡 분석</CardTitle>
            <CardDescription>
              대화 내용을 분석하고 피드백을 받으세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              AI가 당신의 대화를 분석하고 개선점을 제안해드립니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>메시지 작성</CardTitle>
            <CardDescription>
              상황에 맞는 메시지를 작성하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              AI가 상황에 맞는 최적의 메시지를 추천해드립니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
