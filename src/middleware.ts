import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // 로그인 안 된 상태로 대시보드 접근 시 로그인으로 리다이렉트
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인된 상태로 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
