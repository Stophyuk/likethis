# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
npx tsc --noEmit # Type check
```

Deploy: `vercel deploy --prod --yes` (project linked; production = https://likethis.vercel.app)

## Project Overview

LikeThis is a **single-user** build-in-public writing engine. One source memo is transformed by Claude into platform-native drafts for X / Threads / LinkedIn / Bluesky (manual copy-paste publishing — no social APIs). Daily topic suggestions are mined from the user's Notion diary, delivered via Slack, and consistency is tracked with a streak.

Core loop: Notion diary → daily 17:00 KST cron → Slack nudge with topic → `/compose` transform → copy-paste post → check-in → streak.

## Architecture

- **Next.js 16 App Router** + React 19 + TypeScript + Tailwind v4 + shadcn/ui (`src/components/ui/`)
- **AI**: Vercel AI SDK (`ai` v7) + `@ai-sdk/anthropic` direct — `generateObject` with zod schemas. Default model `claude-opus-4-8`, override via `AI_MODEL` env. Wrapper in `src/lib/ai.ts`.
- **DB**: Supabase (service-role key, server-only) via `src/lib/db.ts`. Tables: `kv` (settings, flags), `published` (streak source of truth, one row per day), `suggestions`, `history`. Schema: `supabase/schema.sql`. Streak is **derived** from `published` dates, never stored.
- **Notion**: read-only integration (`src/lib/notion.ts`). Search API returns pages shared with the integration; block direction (newest-at-top vs bottom) is auto-detected via `last_edited_time`; recent-14-days blocks feed the suggestion prompt.
- **Auth**: single password (`APP_PASSWORD`) → httpOnly cookie, enforced in `src/proxy.ts` (Next 16 proxy convention, NOT middleware.ts). Public paths: `/login`, `/api/auth`, `/api/cron`.
- **Cron**: `vercel.json` → `/api/cron/daily` at `0 8 * * *` UTC (= 17:00 KST). Protected by `Authorization: Bearer CRON_SECRET` (Vercel injects it automatically). Idempotent: suggestion reused per date, Slack push deduped via `kv` notified flag.
- **Dates**: all day-keys are KST — always use `getTodayKey()`/`getDateKey()` from `src/lib/date.ts`, never raw `new Date().toISOString()`.

### API Routes (all under `src/app/api/`)

| Route | Purpose |
|---|---|
| `transform` POST | source + platforms → per-platform drafts (voice samples + anti-AI rules from settings; X links go to `firstComment`) |
| `suggest` GET/POST | today's topics (GET reads, POST regenerates from interests + diary + history) |
| `checkin` POST | mark/unmark today published → returns streak |
| `history` POST | "발행 완료" → archive piece + mark published |
| `settings` GET/PUT | user settings in `kv` |
| `cron/daily` GET | ensure suggestion + Slack nudge |
| `auth` POST/DELETE | password → cookie |

### Key Files

- `src/lib/platform-tone.ts` — per-platform rules (char limits, tone, X link-in-first-comment). Add platforms here + `src/lib/types.ts` `Platform` union.
- `src/lib/voice.ts` — system/user prompt assembly (voice few-shot + anti-AI rules)
- `src/lib/suggest.ts` — daily topic generation
- `src/components/compose/` — SourceEditor + PlatformVariations (controlled tabs)
- Design language: "Editorial Workshop" — warm dark default, amber ember accent, Fraunces display font. Tokens in `src/app/globals.css` (`.ember-glow`, `.animate-rise`, `.animate-pop`, grain overlay).

### UX conventions

Keyboard: ⌘+Enter transform, 1–4 switch platform tabs, C copy current draft. Optimistic updates + `animate-pop` celebrations on check-in/complete. Loading = skeletons, not spinners.

## Environment Variables (.env.local / Vercel production)

```
APP_PASSWORD, CRON_SECRET            # auth + cron guard
ANTHROPIC_API_KEY                    # Claude (AI_MODEL optional override)
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
NOTION_TOKEN                         # read-only diary integration
APP_URL                              # prod URL used in Slack nudge links
```

Slack webhook is NOT an env var — it lives in settings (`kv`), editable at `/settings`.

## Gotchas

- New Supabase projects are IPv6-only for direct DB connections; run migrations through the IPv4 pooler: `aws-1-ap-northeast-2.pooler.supabase.com:5432`, user `postgres.<ref>` (DB password kept as a comment in `.env.local`).
- `src/lib/db.ts` throws fast when Supabase env is missing; routes catch and degrade (defaults / friendly errors).
- Settings PUT replaces the whole object — always merge with current settings before writing.
