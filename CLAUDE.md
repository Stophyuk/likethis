# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

Testing (Playwright is installed but no tests exist yet):
```bash
npx playwright test              # Run all tests
npx playwright test tests/auth   # Run specific test file
```

## Project Overview

LikeThis is a Next.js 16 app for managing community engagement across 10 social platforms (X, Product Hunt, Medium, Naver Blog, YouTube, Instagram, Reddit, LinkedIn, Indie Hackers, Kakao). It uses AI-powered recommendations and content transformation via OpenAI GPT-4 Turbo.

## Architecture

### Data Flow & State Management

**Primary data flow**: localStorage ↔ Firebase Firestore (5-min sync interval + beforeunload)

- `useSync.ts` + `SyncProvider.tsx` orchestrate cloud synchronization
- No external state library - uses React hooks + localStorage + Firebase
- Each component manages its own state; SyncProvider handles cloud persistence

**localStorage keys**:
- `likethis_platforms`, `likethis_interests`, `likethis_profile_urls`
- `likethis_kakao_rooms`, `likethis_activities_YYYY-MM-DD`
- `likethis_setup_[platform]`

**Firestore schema**: `users/{uid}/data/`, `users/{uid}/activities/`, `users/{uid}/analysisHistory/`

### Authentication

Session-based auth using Firebase:
1. Firebase Client Auth (email/password or Google OAuth)
2. ID Token → Session Cookie via server action (`createSessionCookie`)
3. Middleware protects `/dashboard/*` routes

Key files: `src/app/(auth)/actions.ts`, `src/middleware.ts`, `src/hooks/useAuth.ts`

### API Routes

All routes use POST and return JSON. Located in `src/app/api/`:

| Endpoint | Purpose |
|----------|---------|
| `/api/recommend` | Generate daily activity recommendations |
| `/api/generate-draft` | Create content draft from topic + key points |
| `/api/transform` | Adapt content for specific platform |
| `/api/summarize-chat` | Kakao chat analysis (70% brief + 30% detailed split) |

### Key Files

- `src/lib/platform-guides.ts` - Master data for all 10 platforms (goals, tips, templates, setup guides)
- `src/types/index.ts` - Central type definitions
- `src/lib/activity-stats.ts` - Activity calculation utilities
- `src/lib/csv-parser.ts` - Kakao CSV parsing with system message filtering
- `src/lib/firebase/firestore.ts` - Firestore CRUD operations

### Component Structure

- `src/components/ui/` - shadcn-ui components (Radix + TailwindCSS)
- `src/components/dashboard/` - Dashboard-specific components
- `src/components/history/`, `compose/`, `guide/`, `kakao/` - Feature-specific components

## Adding New Features

**Adding a new platform**:
1. Add to `Platform` type in `src/types/index.ts`
2. Create guide entry in `src/lib/platform-guides.ts`
3. Add emoji mapping to `getPlatformEmoji()` functions

**Adding a protected page**:
1. Create under `/dashboard` directory
2. Add to navigation in `src/app/dashboard/layout.tsx` (`navItems`)
3. Middleware automatically protects `/dashboard/*`

**Syncing new data to Firestore**:
1. Add getter/setter in `src/lib/firebase/firestore.ts`
2. Call in `useSync.ts` within `syncToCloud()` or `syncFromCloud()`

## Environment Variables

```
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin (server-only)
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

# OpenAI
OPENAI_API_KEY
```
