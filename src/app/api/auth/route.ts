import { NextResponse } from "next/server";

const COOKIE = "lt_auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}) as { password?: string });
  const expected = process.env.APP_PASSWORD;

  if (!expected || body?.password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
