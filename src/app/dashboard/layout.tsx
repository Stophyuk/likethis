import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { logout, getSession } from '@/app/(auth)/actions'
import { MyPlatformLinks } from '@/components/dashboard/MyPlatformLinks'
import { SyncProvider } from '@/components/SyncProvider'
import { NavMenu, MobileNavMenu } from '@/components/dashboard/NavMenu'

export interface NavItem {
  href: string
  label: string
  icon: string
  children?: { href: string; label: string }[]
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: '홈', icon: '🏠' },
  {
    href: '/dashboard/compose',
    label: '창작',
    icon: '✍️',
    children: [
      { href: '/dashboard/compose', label: '글쓰기' },
      { href: '/dashboard/content-factory', label: '팩토리' },
      { href: '/dashboard/muse', label: 'Muse' },
    ],
  },
  {
    href: '/dashboard/events',
    label: '탐색',
    icon: '🔍',
    children: [
      { href: '/dashboard/events', label: '이벤트' },
      { href: '/dashboard/trends', label: '트렌드' },
      { href: '/dashboard/kakao', label: '카톡' },
      { href: '/dashboard/comment', label: '댓글' },
    ],
  },
  {
    href: '/dashboard/journey',
    label: '빌드',
    icon: '🚀',
    children: [
      { href: '/dashboard/journey', label: 'Journey' },
      { href: '/dashboard/ventures', label: 'Ventures' },
      { href: '/dashboard/guide', label: '가이드' },
    ],
  },
  { href: '/dashboard/history', label: '기록', icon: '📊' },
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

        <NavMenu items={navItems} />

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
        <MobileNavMenu items={navItems} />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4 md:p-8 mt-24 md:mt-0">
        <SyncProvider>{children}</SyncProvider>
      </main>
    </div>
  )
}
