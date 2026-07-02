"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <form onSubmit={submit} className="animate-rise w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl lowercase">
            like<span className="text-primary">this</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            매일 이어가는 build in public
          </p>
        </div>
        <div className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoFocus
            className={error ? "border-destructive" : ""}
          />
          {error && (
            <p className="text-sm text-destructive">비밀번호가 틀려요.</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "확인 중…" : "들어가기"}
          </Button>
        </div>
      </form>
    </main>
  );
}
