import { expect, test } from "@playwright/test";

test("회원가입 mock 흐름", async ({ page }) => {
  page.on("dialog", async (dialog) => {
    console.log("[dialog]", dialog.message());
    await dialog.accept();
  });

  await page.goto("/signup");

  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("onboarding_seen", "true");
  });

  await page.goto("/signup");

  await expect(page.getByText("이메일")).toBeVisible();
  await expect(page.getByPlaceholder("example@planb.com")).toBeVisible();

  await page.getByPlaceholder("example@planb.com").fill("test@test.com");
  await page.getByText("인증전송").click();

  await page.getByPlaceholder("6자리 인증번호").fill("123456");
  await page.getByText("인증확인").click();

  await expect(page.getByText("이메일 인증 완료")).toBeVisible();

  await page.getByPlaceholder("닉네임을 입력하세요").fill("테스트");
  await page.getByPlaceholder("비밀번호를 입력하세요").fill("Test1234!");
  await page.getByPlaceholder("비밀번호를 다시 입력하세요").fill("Test1234!");

  await expect(page.getByText("비밀번호가 일치합니다.")).toBeVisible();

  await page.getByText("회원가입").last().click();

  await expect(
    page.getByText(/간편 로그인|더 스마트한 여행의 시작/),
  ).toBeVisible();
});
