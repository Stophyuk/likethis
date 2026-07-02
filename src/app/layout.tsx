import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "likethis — 매일 이어가는 build in public",
  description:
    "원소스 하나를 X·Threads·LinkedIn·Bluesky 톤에 맞게. 매일 꾸준히 이어가는 나만의 글쓰기 엔진.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <div className="grain-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}
