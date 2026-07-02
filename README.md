# likethis

매일 이어가는 build-in-public을 위한 **1인용 원소스 멀티유즈 글쓰기 엔진**.

메모 하나를 쓰면 Claude가 X · Threads · LinkedIn · Bluesky 각 플랫폼 톤에 맞는 초안으로 바꿔주고(복붙 발행), 노션 일기에서 매일 글감을 발굴해 Slack으로 넛지를 보내주며, 스트릭으로 꾸준함을 기록합니다.

## 핵심 루프

```
노션 일기 → 매일 17:00 KST cron → Slack 넛지(오늘의 소재)
  → /compose 에서 4개 플랫폼 변형 → 복붙 게시 → 발행 완료 체크 → 🔥 스트릭
```

## 기능

- **작성 & 변형** — 원소스 하나를 플랫폼별 글자수·톤·포맷에 맞게 변형. 내 과거 글 샘플로 보이스 유지, X는 링크를 첫 댓글로 분리
- **매일 소재 제안** — 관심사 + 최근 노션 일기 + 히스토리 기반, Slack DM으로 도착
- **스트릭** — 발행한 날을 체크하면 연속 일수와 최근 5주 캘린더로 시각화
- **단축키** — `⌘+Enter` 변형 · `1–4` 탭 전환 · `C` 복사

## 스택

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · AI SDK + `@ai-sdk/anthropic`(Claude) · Supabase · Notion API(읽기) · Slack Incoming Webhook · Vercel Cron

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

`.env.local` 필요 변수:

```
APP_PASSWORD=            # 로그인 비밀번호 (단일 사용자)
CRON_SECRET=             # cron 보호 시크릿
ANTHROPIC_API_KEY=       # Claude API
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NOTION_TOKEN=            # 노션 integration (일기 페이지 공유 필요)
APP_URL=                 # 배포 URL (Slack 넛지 링크용)
```

DB 스키마는 `supabase/schema.sql`을 Supabase SQL Editor에서 실행. Slack 웹훅 URL은 앱의 `/settings`에서 입력합니다.

## 배포

Vercel. `vercel.json`의 cron(`0 8 * * *` UTC = 17:00 KST)이 매일 소재 생성과 Slack 넛지를 담당합니다.

자세한 구조는 [CLAUDE.md](./CLAUDE.md) 참고.
