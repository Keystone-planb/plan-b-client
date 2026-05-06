import { test, expect } from "@playwright/test";

test.describe("홈 화면 smoke test", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[browser:${msg.type()}]`, msg.text());
    });

    page.on("pageerror", (error) => {
      console.log("[browser:pageerror]", error.message);
    });

    // 웹 E2E에서는 서버/CORS에 흔들리지 않도록 내 정보 조회 API를 mock 처리
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

    // AsyncStorage web fallback용 토큰 주입
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

    await expect(
      page.getByPlaceholder(/여행 이름|일정 이름|여행 제목/),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
