import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-gray-600 mt-2">
          계정 및 앱 설정을 관리하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로필</CardTitle>
          <CardDescription>계정 정보를 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">설정 기능은 추후 업데이트 예정입니다.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>플랫폼 연동</CardTitle>
          <CardDescription>SNS 계정을 연동합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">OAuth 연동은 추후 업데이트 예정입니다.</p>
        </CardContent>
      </Card>
    </div>
  )
}
