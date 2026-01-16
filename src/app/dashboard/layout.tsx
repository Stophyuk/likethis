import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logout, getSession } from '@/app/(auth)/actions'
import { MyPlatformLinks } from '@/components/dashboard/MyPlatformLinks'
import { SyncProvider } from '@/components/SyncProvider'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: '🏠' },
  { href: '/dashboard/events', label: '이벤트', icon: '📅' },
  { href: '/dashboard/trends', label: '트렌드', icon: '📊' },
  { href: '/dashboard/kakao', label: '카톡', icon: '💬' },
  { href: '/dashboard/compose', label: '작성', icon: '✍️' },
  { href: '/dashboard/comment', label: '댓글', icon: '💭' },
  { href: '/dashboard/guide', label: '가이드', icon: '📚' },
  { href: '/dashboard/history', label: '히스토리', icon: '📈' },
  { href: '/dashboard/settings', label: '설정', icon: '⚙️' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col">
        <div className="p-4 border-b">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            LikeThis
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* 내 플랫폼 섹션 */}
        <MyPlatformLinks />

        {/* 유저 정보 & 로그아웃 */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate">{session?.email}</span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="text-lg font-bold">LikeThis</Link>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">로그아웃</Button>
          </form>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-shrink-0 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4 md:p-8 mt-24 md:mt-0">
        <SyncProvider>{children}</SyncProvider>
      </main>
    </div>
  )
}
