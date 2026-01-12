# LikeThis

10개 소셜 플랫폼에서 커뮤니티 활동을 체계적으로 관리하고, AI 기반 추천과 콘텐츠 변환을 제공하는 웹 애플리케이션입니다.

## 지원 플랫폼

X, Product Hunt, Medium, Naver Blog, YouTube, Instagram, Reddit, LinkedIn, Indie Hackers, Kakao

## 주요 기능

- **대시보드**: 일일 체크리스트, 활동 스트릭, 플랫폼별 진행률 확인
- **AI 추천**: 플랫폼별 맞춤 활동 추천 (GPT-4 Turbo)
- **콘텐츠 작성**: 아이디어 → 초안 → 플랫폼별 변환 3단계 워크플로우
- **카카오 분석**: CSV 업로드로 채팅방 대화 AI 분석
- **활동 히스토리**: 주간 비교, 플랫폼 통계, 타임라인
- **플랫폼 가이드**: 각 플랫폼별 설정 및 활용 가이드

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS 4
- **UI**: Radix UI, shadcn-ui, Lucide Icons
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Email/Google OAuth)
- **AI**: OpenAI GPT-4 Turbo

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# OpenAI
OPENAI_API_KEY=
```

### 설치 및 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## 배포

Vercel에서 배포할 수 있습니다. 환경 변수를 Vercel 프로젝트 설정에 추가하세요.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Stophyuk/likethis)
