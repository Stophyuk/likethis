"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "오늘" },
  { href: "/compose", label: "작성" },
  { href: "/settings", label: "설정" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link
          href="/"
          className="font-display text-lg tracking-tight lowercase"
        >
          like<span className="text-primary">this</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
