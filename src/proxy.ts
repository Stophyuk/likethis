import { NextResponse, type NextRequest } from "next/server";

// Single-user password gate. Public paths + cron (own secret) bypass.
const PUBLIC_PREFIXES = ["/login", "/api/auth", "/api/cron"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const password = process.env.APP_PASSWORD;
  // No password configured → open (local dev convenience).
  if (!password) return NextResponse.next();

  const authed = request.cookies.get("lt_auth")?.value === password;
  if (!authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
