import { test, expect } from "@playwright/test";

test.describe("홈 화면 smoke test", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[browser:${msg.type()}]`, msg.text());
    });

    page.on("pageerror", (error) => {
      console.log("[browser:pageerror]", error.message);
    });

    await page.route("**/api/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          email: "e2e@example.com",
          nickname: "테스트",
          provider: "e2e",
        }),
      });
    });

    await page.goto("http://localhost:8081", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      window.localStorage.setItem("access_token", "e2e-test-access-token");
      window.localStorage.setItem("refresh_token", "e2e-test-refresh-token");
      window.localStorage.setItem("user_id", "6");
    });

    await page.reload({
      waitUntil: "domcontentloaded",
    });
  });

  test("홈 화면이 정상 렌더링된다", async ({ page }) => {
    await expect(page.getByText("Plan.B")).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText("더 스마트한 여행의 시작")).toBeVisible();
    await expect(page.getByText("일정 추가하기")).toBeVisible();

    const hasEmptyText = await page
      .getByText("등록된 일정이 없습니다")
      .isVisible()
      .catch(() => false);

    const hasScheduleCard = await page
      .locator("text=여행")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasEmptyText || hasScheduleCard).toBeTruthy();
  });

  test("일정 추가 버튼을 누르면 여행 이름 설정 화면으로 이동한다", async ({
    page,
  }) => {
    await expect(page.getByText("일정 추가하기")).toBeVisible({
      timeout: 15000,
    });

    await page.getByText("일정 추가하기").click();

    const tripNameInput = page.locator("input").first();

    await expect(tripNameInput).toBeVisible({
      timeout: 15000,
    });

    await tripNameInput.fill("E2E 테스트 여행");

    await expect(tripNameInput).toHaveValue("E2E 테스트 여행");
  });
});
