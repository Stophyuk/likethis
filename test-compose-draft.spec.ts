import { test, expect } from '@playwright/test'

test.describe('작성 페이지 초안 생성 기능', () => {
  test.beforeEach(async ({ context }) => {
    // 세션 쿠키 설정 (로그인 상태 모방)
    await context.addCookies([{
      name: 'session',
      value: 'test-session-cookie',
      domain: 'localhost',
      path: '/',
    }])
  })

  test('초안 생성 플로우 테스트', async ({ page }) => {
    // 작성 페이지 접속
    await page.goto('http://localhost:3000/dashboard/compose')
    await page.waitForLoadState('networkidle')

    // === 1. 아이디어 입력 단계 UI 확인 ===

    // 주제 입력 필드 확인
    const topicInput = page.locator('input[placeholder*="예: 1인개발"]')
    await expect(topicInput).toBeVisible()

    // 핵심 내용 입력 필드 확인
    const keyPointsTextarea = page.locator('textarea[placeholder*="bullet point"]')
    await expect(keyPointsTextarea).toBeVisible()

    // "AI 초안 생성" 버튼 확인
    const generateButton = page.locator('button:has-text("AI 초안 생성")')
    await expect(generateButton).toBeVisible()

    // === 2. 초안 생성 테스트 ===

    // API 모킹 - 실제 OpenAI 호출 대신 테스트 응답 반환
    await page.route('**/api/generate-draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          draft: '테스트 초안 내용입니다.\n\n테스트 내용1에 대한 설명입니다.\n테스트 내용2에 대한 설명입니다.\n\n이것은 AI가 생성한 테스트 초안입니다.'
        })
      })
    })

    // 주제 입력
    await topicInput.fill('테스트 글')

    // 핵심 내용 입력
    await keyPointsTextarea.fill('- 테스트 내용1\n- 테스트 내용2')

    // AI 초안 생성 버튼 클릭
    await generateButton.click()

    // 초안이 생성되고 draft 단계로 이동하는지 확인
    await expect(page.locator('text=AI 초안')).toBeVisible({ timeout: 10000 })

    // 생성된 초안 내용 확인
    const draftTextarea = page.locator('textarea').nth(0)
    await expect(draftTextarea).toHaveValue(/테스트 초안 내용/)

    // === 3. 변환 단계로 이동 ===

    // "이대로 변환하기" 버튼 확인
    const transformButton = page.locator('button:has-text("이대로 변환하기")')
    await expect(transformButton).toBeVisible()

    // 버튼 클릭
    await transformButton.click()

    // 플랫폼 변환 UI로 이동했는지 확인 (CardTitle 확인)
    await expect(page.locator('[data-slot="card-title"]:has-text("원본 콘텐츠")')).toBeVisible()

    // 초안이 원본 콘텐츠 영역에 복사되었는지 확인
    const originalContentTextarea = page.locator('textarea[placeholder*="공유하고 싶은"]')
    await expect(originalContentTextarea).toHaveValue(/테스트 초안 내용/)

    // 플랫폼 탭들이 표시되는지 확인
    await expect(page.locator('button[role="tab"]').first()).toBeVisible()
  })

  test('직접 작성하기 버튼 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/compose')
    await page.waitForLoadState('networkidle')

    // "직접 작성하기" 버튼 확인
    const skipButton = page.locator('button:has-text("직접 작성하기")')
    await expect(skipButton).toBeVisible()

    // 버튼 클릭
    await skipButton.click()

    // 바로 변환 단계로 이동하는지 확인
    await expect(page.locator('[data-slot="card-title"]:has-text("원본 콘텐츠")')).toBeVisible()
  })

  test('입력 필드 없이 생성 버튼 비활성화', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/compose')
    await page.waitForLoadState('networkidle')

    const generateButton = page.locator('button:has-text("AI 초안 생성")')

    // 초기 상태에서 버튼 비활성화 확인
    await expect(generateButton).toBeDisabled()

    // 주제만 입력
    const topicInput = page.locator('input[placeholder*="예: 1인개발"]')
    await topicInput.fill('테스트')
    await expect(generateButton).toBeDisabled()

    // 핵심 내용 추가
    const keyPointsTextarea = page.locator('textarea[placeholder*="bullet point"]')
    await keyPointsTextarea.fill('- 테스트')

    // 버튼 활성화 확인
    await expect(generateButton).toBeEnabled()
  })
})
