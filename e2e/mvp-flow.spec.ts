import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8081";

async function goToLogin(page: Page) {
  await page.goto(BASE_URL);

  const skipButton = page.getByText("건너뛰기").first();
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.click();
  }

  const startButton = page.getByText("시작하기").first();
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  }
}

async function mockLogin(page: Page) {
  await goToLogin(page);

  const emailInput = page.getByPlaceholder(/example|이메일|planb/i).first();
  await emailInput.fill("test@test.com");

  const passwordInput = page.getByPlaceholder(/비밀번호/).first();
  await passwordInput.fill("1234");

  await page.getByText("로그인").first().click();

  await expect(
    page.getByText(/등록된 일정이 없습니다|일정 추가하기|Plan\.B|날씨 알림/),
  ).toBeVisible({
    timeout: 15000,
  });
}

test.describe("MVP 자동 QA", () => {
  test("mock 로그인 후 Home에 진입할 수 있다", async ({ page }) => {
    await mockLogin(page);

    await expect(
      page.getByText(/등록된 일정이 없습니다|일정 추가하기|날씨 알림/),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("Home 날씨 알림 카드가 표시되고 닫을 수 있다", async ({ page }) => {
    await mockLogin(page);

    const weatherTitle = page.getByText("날씨 알림").first();
    await expect(weatherTitle).toBeVisible({
      timeout: 15000,
    });

    const closeButton = page
      .locator("text=날씨 알림")
      .locator("..")
      .getByRole("button")
      .first();

    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  });

  test("Home에서 대안 추천 보기로 Plan.A에 진입할 수 있다", async ({
    page,
  }) => {
    await mockLogin(page);

    const recommendButton = page.getByText("대안 추천 보기").first();
    await expect(recommendButton).toBeVisible({
      timeout: 15000,
    });

    await recommendButton.click();

    await expect(page.getByText(/AI 대안 추천|대안 장소/)).toBeVisible({
      timeout: 15000,
    });
  });

  test("Plan.A 추천 카드에서 추천 장소가 표시된다", async ({ page }) => {
    await mockLogin(page);

    const recommendButton = page.getByText("대안 추천 보기").first();
    await recommendButton.click();

    await expect(page.getByText("AI 대안 추천")).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByText(/대안 장소 추천이 완료되었습니다|비 오는 날|국립현대미술관/),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test("Profile 화면으로 이동하고 로그아웃할 수 있다", async ({ page }) => {
    await mockLogin(page);

    const profileTab = page.getByTestId("bottom-tab-Profile").first();

    await expect(profileTab).toBeVisible({
      timeout: 15000,
    });

    await profileTab.click();

    const logoutButton = page.getByText("로그아웃").first();

    await expect(logoutButton).toBeVisible({
      timeout: 15000,
    });

    await expect(logoutButton).toBeVisible({
      timeout: 15000,
    });

    await logoutButton.click();

    await expect(page.getByText("간편 로그인")).toBeVisible({
      timeout: 15000,
    });
  });
});
